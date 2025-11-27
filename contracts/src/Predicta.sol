// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./PredictaEventContract.sol";


/**
 * @title Betting Platform Factory
 * @dev Factory contract for creating and managing betting events
 */
contract Predicta is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Clones for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    struct Category {
        string name;
        string description;
        bool active;
    }
    
    address public eventImplementation;
    address[] public allowedTokens;
    address[] public events;
    Category[] public categories;
    uint256 public creatorStakeAmount;
    uint256 public defaultCreatorFeePercentage; // Default percentage of the pool that goes to event creator (in basis points, e.g., 250 = 2.5%)

    event EventCreated(
        address indexed eventAddress,
        address indexed creator,
        string question,
        uint256 endTime,
        address tokenAddress
    );
    event EventApproved(address indexed eventAddress, address indexed moderator);
    event EventRejected(address indexed eventAddress, address indexed moderator);
    event EventCancelled(address indexed eventAddress);
    event EventCompleted(address indexed eventAddress, uint8 winningOption);
    event EventNullified(address indexed eventAddress, string reason);
    event CategoryAdded(uint256 indexed categoryId, string name);
    event CategoryUpdated(uint256 indexed categoryId, string name, bool active);
    event TokenAdded(address indexed tokenAddress);
    event TokenRemoved(address indexed tokenAddress);
    event CreatorStakeAmountUpdated(uint256 amount);
    event DefaultCreatorFeeUpdated(uint256 percentage);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    constructor(uint256 _defaultCreatorFeePercentage) {
        require(_defaultCreatorFeePercentage <= 1000, "Fee cannot exceed 10%");
        
        defaultCreatorFeePercentage = _defaultCreatorFeePercentage;

        eventImplementation = address(new EventContract());
        
        // Setup roles
        require(_grantRole(DEFAULT_ADMIN_ROLE, msg.sender), "Granting DEFAULT_ADMIN_ROLE failed");
        require(_grantRole(ADMIN_ROLE, msg.sender), "Granting ADMIN_ROLE failed");
        require(_grantRole(MODERATOR_ROLE, msg.sender), "Granting MODERATOR_ROLE failed");
        
        // Add default category
        Category memory newCategory;
        newCategory.name = "General";
        newCategory.description = "General betting category";
        newCategory.active = true;
        categories.push(newCategory);
    }

    // ===== Event Creation and Management =====
    function createEvent(
        string memory _question,
        string memory _description,
        string[] memory _options,
        string memory _eventType,
        uint256 _categoryId,
        string memory _eventImage,
        uint256 _endTime,
        address _tokenAddress
    ) external nonReentrant returns (address) {
        require(_categoryId < categories.length, "Invalid category");
        require(categories[_categoryId].active, "Category not active");
        require(isTokenAllowed(_tokenAddress), "Token not allowed");
        
        // Check if admin or handle user creation with stake
        bool isAdmin = hasRole(ADMIN_ROLE, msg.sender);
        
        address newEvent = Clones.clone(eventImplementation);

        EventContract(newEvent).initialize(_question, _description, _options, _eventType, categories[_categoryId].name, _eventImage, _endTime, msg.sender, address(this), _tokenAddress, defaultCreatorFeePercentage);
        
        // Store the event
        events.push(newEvent);
        
        // If admin created, automatically approve
        if (isAdmin) {
            EventContract(newEvent).updateEventStatus(EventContract.EventStatus.Approved);
        }
        
        emit EventCreated(newEvent, msg.sender, _question, _endTime, _tokenAddress);
        
        return newEvent;
    }

    function approveEvent(address _eventAddress) external onlyRole(MODERATOR_ROLE) {
        EventContract event_ = EventContract(_eventAddress);
        
        // Get event details to validate status
        (,,,,,, EventContract.EventStatus status,,,,,,,) = event_.getEventDetails();
        
        require(status == EventContract.EventStatus.Pending, "Event not pending");
        
        // Approve the event
        event_.updateEventStatus(EventContract.EventStatus.Approved);
        
        emit EventApproved(_eventAddress, msg.sender);
    }

    function rejectEvent(address _eventAddress) external onlyRole(MODERATOR_ROLE) {
        EventContract event_ = EventContract(_eventAddress);
        
        // Get event details to validate status
        (,,,,,, EventContract.EventStatus status,,,,,,,) = event_.getEventDetails();
        
        require(status == EventContract.EventStatus.Pending, "Event not pending");
        
        // Reject the event
        event_.updateEventStatus(EventContract.EventStatus.Rejected);
        
        emit EventRejected(_eventAddress, msg.sender);
    }

    function cancelEvent(address _eventAddress) external {
        EventContract event_ = EventContract(_eventAddress);
        
        // Get event details
        (,,,,,, EventContract.EventStatus status,,, address creator,, uint256 totalStaked,,) = event_.getEventDetails();
        
        // Only creator or admin can cancel
        require(
            creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        
        // Event can only be cancelled if pending or approved with no stakes
        require(status == EventContract.EventStatus.Pending || (status == EventContract.EventStatus.Approved && totalStaked == 0), "Cannot cancel event");
        
        // Cancel the event
        event_.updateEventStatus(EventContract.EventStatus.Cancelled);
        
        emit EventCancelled(_eventAddress);
    }

    function cancelEventWithStakes(address _eventAddress) external onlyRole(ADMIN_ROLE) {
        EventContract event_ = EventContract(_eventAddress);
        
        // Get event details
        (,,,,,, EventContract.EventStatus status,,,,,,,) = event_.getEventDetails();
        
        // Only approved events can be cancelled with stakes
        require(status == EventContract.EventStatus.Approved, "Event not approved");
        
        // Cancel the event
        event_.updateEventStatus(EventContract.EventStatus.Cancelled);
        
        // Refund all stakes
        event_.refundAllStakes();
        
        emit EventCancelled(_eventAddress);
    }

    function completeEvent(address _eventAddress, uint8 _winningOption) external onlyRole(MODERATOR_ROLE) {
        EventContract event_ = EventContract(_eventAddress);
        
        // Get event details
        (,,,,,, EventContract.EventStatus status, uint256 endTime,,,,,,) = event_.getEventDetails();
        
        // Event must be approved and past end time
        require(status == EventContract.EventStatus.Approved, "Event not approved");
        require(block.timestamp >= endTime, "Event not ended");
        
        // Check if event should be nullified before completing
        (bool shouldNullify, string memory reason) = event_.checkNullificationConditions();
        
        if (shouldNullify) {
            // Nullify the event instead of completing it
            event_.nullifyEvent(reason);
            
            emit EventNullified(_eventAddress, reason);
            return;
        }
        
        // Complete the event normally
        event_.updateEventStatus(EventContract.EventStatus.Completed);
        
        // Set winning option
        event_.setWinningOption(_winningOption);
        
        emit EventCompleted(_eventAddress, _winningOption);
    }

    /**
     * @dev Manually nullify an event (admin function for edge cases)
     * @param _eventAddress The address of the event to nullify
     * @param _reason The reason for nullification
     */
    function nullifyEvent(address _eventAddress, string memory _reason) external onlyRole(MODERATOR_ROLE) {
        EventContract event_ = EventContract(_eventAddress);
        
        // Get event details
        (,,,,,, EventContract.EventStatus status,,,,,,,) = event_.getEventDetails();
        
        // Event must be approved or completed
        require(
            status == EventContract.EventStatus.Approved || status == EventContract.EventStatus.Completed,
            "Event cannot be nullified in current status"
        );
        
        // Nullify the event
        event_.nullifyEvent(_reason);
        
        emit EventNullified(_eventAddress, _reason);
    }

    /**
     * @dev Check if an event meets nullification conditions
     * @param _eventAddress The address of the event to check
     * @return shouldNullify Whether the event should be nullified
     * @return reason The reason for nullification
     */
    function checkEventNullification(address _eventAddress) external view returns (bool shouldNullify, string memory reason) {
        EventContract event_ = EventContract(_eventAddress);
        return event_.checkNullificationConditions();
    }

    // ===== Category Management =====
    function addCategory(string memory _name, string memory _description) external onlyRole(ADMIN_ROLE) {
        Category memory newCategory;
        newCategory.name = _name;
        newCategory.description = _description;
        newCategory.active = true;
        categories.push(newCategory);
        emit CategoryAdded(categories.length - 1, _name);
    }

    function updateCategory(uint256 _categoryId, string memory _name, string memory _description, bool _active) external onlyRole(ADMIN_ROLE) {
        require(_categoryId < categories.length, "Invalid category");
        
        Category storage category = categories[_categoryId];
        category.name = _name;
        category.description = _description;
        category.active = _active;
        
        emit CategoryUpdated(_categoryId, _name, _active);
    }

    function getCategoriesCount() external view returns (uint256) {
        return categories.length;
    }

    function getAllCategories() external view returns (Category[] memory) {
        Category[] memory allCategories = new Category[](categories.length);
        
        for (uint i = 0; i < categories.length; i++) {
            allCategories[i] = categories[i];
        }
        
        return allCategories;
    }

    // ===== Token Management =====
    function addToken(address _tokenAddress) external onlyRole(ADMIN_ROLE) {
        require(_tokenAddress != address(0), "Invalid token address");
        require(!isTokenAllowed(_tokenAddress), "Token already added");
        
        allowedTokens.push(_tokenAddress);
        emit TokenAdded(_tokenAddress);
    }

    function removeToken(address _tokenAddress) external onlyRole(ADMIN_ROLE) {
        for (uint i = 0; i < allowedTokens.length; i++) {
            if (allowedTokens[i] == _tokenAddress) {
                // Swap with the last element and pop
                allowedTokens[i] = allowedTokens[allowedTokens.length - 1];
                allowedTokens.pop();
                emit TokenRemoved(_tokenAddress);
                return;
            }
        }
        revert("Token not found");
    }

    function isTokenAllowed(address _tokenAddress) public view returns (bool) {
        for (uint i = 0; i < allowedTokens.length; i++) {
            if (allowedTokens[i] == _tokenAddress) {
                return true;
            }
        }
        return false;
    }

    function getAllowedTokensCount() external view returns (uint256) {
        return allowedTokens.length;
    }

    // ===== Stakes Management =====
    function updateDefaultCreatorFee(uint256 _percentage) external onlyRole(ADMIN_ROLE) {
        require(_percentage <= 1000, "Fee cannot exceed 10%");
        if (defaultCreatorFeePercentage != _percentage) {
            defaultCreatorFeePercentage = _percentage;
            emit DefaultCreatorFeeUpdated(_percentage);
        }
    }

    // ===== Event Queries =====
    function getEventsCount() external view returns (uint256) {
        return events.length;
    }

    function getAllEvents() external view returns (address[] memory) {
        return events;
    }

    function getEventsByStatus(EventContract.EventStatus _status) external view returns (address[] memory) {
        // Count events with the specified status
        uint256 count = 0;
        for (uint i = 0; i < events.length; i++) {
            (,,,,,, EventContract.EventStatus status,,,,,,,) = EventContract(events[i]).getEventDetails();
            if (status == _status) {
                count++;
            }
        }
        
        // Create and populate the result array
        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint i = 0; i < events.length; i++) {
            (,,,,,, EventContract.EventStatus status,,,,,,,) = EventContract(events[i]).getEventDetails();
            if (status == _status) {
                result[index] = events[i];
                index++;
            }
        }
        
        return result;
    }

    function getEventsByCategory(uint256 _categoryId) external view returns (address[] memory) {
        require(_categoryId < categories.length, "Invalid category");
        string memory categoryName = categories[_categoryId].name;
        
        // Count events in the specified category
        uint256 count = 0;
        for (uint i = 0; i < events.length; i++) {
            (,,,, string memory category,,,,,,,,,) = EventContract(events[i]).getEventDetails();
            if (keccak256(bytes(category)) == keccak256(bytes(categoryName))) {
                count++;
            }
        }
        
        // Create and populate the result array
        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint i = 0; i < events.length; i++) {
            (,,,, string memory category,,,,,,,,,) = EventContract(events[i]).getEventDetails();
            if (keccak256(bytes(category)) == keccak256(bytes(categoryName))) {
                result[index] = events[i];
                index++;
            }
        }
        
        return result;
    }

    function getEventsByCreator(address _creator) external view returns (address[] memory) {
        // Count events by the specified creator
        uint256 count = 0;
        for (uint i = 0; i < events.length; i++) {
            (,,,,,,,,, address creator,,,,) = EventContract(events[i]).getEventDetails();
            if (creator == _creator) {
                count++;
            }
        }
        
        // Create and populate the result array
        address[] memory result = new address[](count);
        uint256 index = 0;
        for (uint i = 0; i < events.length; i++) {
            (,,,,,,,,, address creator,,,,) = EventContract(events[i]).getEventDetails();
            if (creator == _creator) {
                result[index] = events[i];
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get all nullified events
     * @return Array of nullified event addresses
     */
    function getNullifiedEvents() external view returns (address[] memory) {
        return this.getEventsByStatus(EventContract.EventStatus.Nullified);
    }

    /**
     * @dev Emergency function to withdraw tokens stuck in factory (admin only)
     * @param _token Token address to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyRole(ADMIN_ROLE) {
        IERC20(_token).safeTransfer(msg.sender, _amount);
        emit EmergencyWithdrawal(_token, _amount);
    }
}