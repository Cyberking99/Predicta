// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Event Contract
 * @dev Contract for a single betting event
 */
contract EventContract is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum EventStatus { Pending, Approved, Completed, Rejected, Cancelled, Nullified }
    
    struct EventDetails {
        string question;
        string description;
        string[] options;
        string eventType;
        string category;
        string eventImage;
        EventStatus status;
        uint256 endTime;
        uint8 winningOption;
        address creator;
        address tokenAddress;
        uint256 totalStaked;
        uint256 creatorFeePercentage;
        bool creatorRewardClaimed;
        string nullificationReason;
    }

    struct UserStake {
        uint8 selectedOption;
        uint256 amount;
        bool claimed;
    }

    EventDetails public eventDetails;
    
    bool private initialized;
    address public factory;
    address public eventCreator;
    mapping(address => UserStake) public userStakes;
    address[] public stakers;
    uint256[] public optionTotals;
    uint256 public constant CLAIM_DEADLINE = 30 days;
    uint256 public eventCompletedTime;
    
    event StakePlaced(address indexed user, uint8 selectedOption, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event CreatorRewardClaimed(address indexed creator, uint256 amount);
    event EventStatusUpdated(EventStatus status);
    event WinningOptionSet(uint8 winningOption);
    event MultipleWinnersSet(uint8[] winningOptions);
    event EventNullified(string reason);

    modifier onlyOwner() {
        require(msg.sender == eventCreator, "Only creator can call");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call");
        _;
    }

    modifier onlyIfStatus(EventStatus _status) {
        require(eventDetails.status == _status, "Invalid event status");
        _;
    }

    constructor() {
        initialized = false;
    }

    function initialize(
        string memory _question,
        string memory _description,
        string[] memory _options,
        string memory _eventType,
        string memory _category,
        string memory _eventImage,
        uint256 _endTime,
        address _creator,
        address _factoryContract,
        address _tokenAddress,
        uint256 _creatorFeePercentage
    ) external {
        require(_options.length >= 2, "At least two options required");
        require(_endTime > block.timestamp, "End time must be in future");
        require(_creatorFeePercentage <= 1000, "Creator fee cannot exceed 10%");
        
        eventDetails = EventDetails({
            question: _question,
            description: _description,
            options: _options,
            eventType: _eventType,
            category: _category,
            eventImage: _eventImage,
            status: EventStatus.Pending,
            endTime: _endTime,
            winningOption: 255, // Not set
            creator: _creator,
            tokenAddress: _tokenAddress,
            totalStaked: 0,
            creatorFeePercentage: _creatorFeePercentage,
            creatorRewardClaimed: false,
            nullificationReason: ""
        });
        
        factory = _factoryContract;
        eventCreator = _creator;
        
        // Initialize optionTotals array
        for (uint i = 0; i < _options.length; i++) {
            optionTotals.push(0);
        }

        initialized = true;
    }

    function updateEventStatus(EventStatus _status) external onlyFactory {
        eventDetails.status = _status;
        
        // If the event is being completed, set the completion time
        if (_status == EventStatus.Completed) {
            eventCompletedTime = block.timestamp;
        }
        
        emit EventStatusUpdated(_status);
    }

    function stake(uint8 _option, uint256 _amount) external nonReentrant onlyIfStatus(EventStatus.Approved) {
        require(block.timestamp < eventDetails.endTime, "Event ended");
        require(_option < eventDetails.options.length, "Invalid option");
        require(_amount > 0, "Amount must be greater than 0");
        
        IERC20 token = IERC20(eventDetails.tokenAddress);
        
        // Transfer tokens from user to this contract
        token.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user stake
        if (userStakes[msg.sender].amount == 0) {
            stakers.push(msg.sender);
            userStakes[msg.sender] = UserStake({
                selectedOption: _option,
                amount: _amount,
                claimed: false
            });
        } else {
            // User can only add more to their existing option
            require(userStakes[msg.sender].selectedOption == _option, "Cannot change option");
            userStakes[msg.sender].amount += _amount;
        }
        
        // Update option total
        optionTotals[_option] += _amount;
        
        // Update total staked
        eventDetails.totalStaked += _amount;
        
        emit StakePlaced(msg.sender, _option, _amount);
    }

    function withdrawStake() external nonReentrant {
        require(
            eventDetails.status == EventStatus.Approved,
            "Cannot withdraw in current status"
        );
        require(block.timestamp < eventDetails.endTime, "Event ended");
        
        UserStake storage userStake = userStakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        
        uint256 amount = userStake.amount;
        uint8 option = userStake.selectedOption;
        
        // Update state before transfer
        optionTotals[option] -= amount;
        eventDetails.totalStaked -= amount;
        userStake.amount = 0;
        
        // Transfer tokens back to user
        IERC20 token = IERC20(eventDetails.tokenAddress);
        token.safeTransfer(msg.sender, amount);
        
        emit StakeWithdrawn(msg.sender, amount);
    }

    function setWinningOption(uint8 _winningOption) external onlyFactory onlyIfStatus(EventStatus.Completed) {
        require(_winningOption < eventDetails.options.length, "Invalid option");
        eventDetails.winningOption = _winningOption;
        emit WinningOptionSet(_winningOption);
    }

    function setMultipleWinners(uint8[] calldata _winningOptions) external onlyFactory onlyIfStatus(EventStatus.Completed) {
        for (uint i = 0; i < _winningOptions.length; i++) {
            require(_winningOptions[i] < eventDetails.options.length, "Invalid option");
        }
        
        // Set the first winning option as the primary one
        if (_winningOptions.length > 0) {
            eventDetails.winningOption = _winningOptions[0];
        }
        
        emit MultipleWinnersSet(_winningOptions);
    }

    /**
     * @dev Check if event should be nullified based on staking patterns
     * @return shouldNullify Whether the event should be nullified
     * @return reason The reason for nullification
     */
    function checkNullificationConditions() public view returns (bool shouldNullify, string memory reason) {
        // Check if only one person staked
        if (stakers.length == 1) {
            return (true, "The Event has been nullified due to No Odds (Only 1 Person Staked)");
        }
        
        // Check if all stakers are on one side
        if (stakers.length > 1) {
            uint256 optionsWithStakes = 0;
            for (uint i = 0; i < optionTotals.length; i++) {
                if (optionTotals[i] > 0) {
                    optionsWithStakes++;
                }
            }
            
            if (optionsWithStakes == 1) {
                return (true, "The Event has been nullified due to No Odds (All People are on one Side)");
            }
        }
        
        return (false, "");
    }

    /**
     * @dev Nullify the event - can be called by factory when conditions are met
     * @param _reason The reason for nullification
     */
    function nullifyEvent(string memory _reason) external onlyFactory {
        require(
            eventDetails.status == EventStatus.Approved || eventDetails.status == EventStatus.Completed,
            "Event cannot be nullified in current status"
        );
        
        eventDetails.status = EventStatus.Nullified;
        eventDetails.nullificationReason = _reason;
        
        emit EventNullified(_reason);
        emit EventStatusUpdated(EventStatus.Nullified);
    }

    /**
     * @dev Claim refund for nullified event
     */
    function claimNullificationRefund() external nonReentrant {
        require(eventDetails.status == EventStatus.Nullified, "Event not nullified");
        
        UserStake storage userStake = userStakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(!userStake.claimed, "Refund already claimed");
        
        uint256 amount = userStake.amount;
        userStake.claimed = true;
        
        // Transfer full stake back to user (no profits, no fees)
        IERC20 token = IERC20(eventDetails.tokenAddress);
        token.safeTransfer(msg.sender, amount);
        
        emit RewardClaimed(msg.sender, amount);
    }

    function claimReward() external nonReentrant {
        require(eventDetails.status == EventStatus.Completed, "Event not completed");
        require(eventDetails.winningOption != 255, "Winning option not set");
        
        UserStake storage userStake = userStakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(!userStake.claimed, "Reward already claimed");
        require(userStake.selectedOption == eventDetails.winningOption, "Did not bet on winning option");
        
        // Mark as claimed
        userStake.claimed = true;
        
        // Calculate creator fee
        uint256 creatorFee = (eventDetails.totalStaked * eventDetails.creatorFeePercentage) / 10000;
        
        // Calculate remaining pool after creator fee
        uint256 remainingPool = eventDetails.totalStaked - creatorFee;
        
        // Calculate reward
        uint256 winningPool = optionTotals[eventDetails.winningOption];
        
        // Prevent division by zero
        require(winningPool > 0, "No bets on winning option");
        
        uint256 rewardAmount = (userStake.amount * remainingPool) / winningPool;
        
        // Transfer reward
        IERC20 token = IERC20(eventDetails.tokenAddress);
        token.safeTransfer(msg.sender, rewardAmount);
        
        emit RewardClaimed(msg.sender, rewardAmount);
    }
    
    function claimCreatorReward() external nonReentrant {
        require(msg.sender == eventDetails.creator, "Only creator can claim");
        require(eventDetails.status == EventStatus.Completed, "Event not completed");
        require(eventDetails.winningOption != 255, "Winning option not set");
        require(!eventDetails.creatorRewardClaimed, "Creator reward already claimed");
        
        // Mark as claimed
        eventDetails.creatorRewardClaimed = true;
        
        // Calculate creator fee
        uint256 creatorFee = (eventDetails.totalStaked * eventDetails.creatorFeePercentage) / 10000;
        
        // Transfer creator fee
        IERC20 token = IERC20(eventDetails.tokenAddress);
        token.safeTransfer(eventDetails.creator, creatorFee);
        
        emit CreatorRewardClaimed(eventDetails.creator, creatorFee);
    }

    function refundAllStakes() external onlyFactory {
        require(
            eventDetails.status == EventStatus.Cancelled || 
            eventDetails.status == EventStatus.Nullified,
            "Event not cancelled or nullified"
        );
        
        IERC20 token = IERC20(eventDetails.tokenAddress);
        
        // Refund all stakes
        for (uint i = 0; i < stakers.length; i++) {
            address staker = stakers[i];
            UserStake storage userStake = userStakes[staker];
            
            if (userStake.amount > 0 && !userStake.claimed) {
                uint256 amount = userStake.amount;
                userStake.amount = 0;
                userStake.claimed = true;
                
                token.safeTransfer(staker, amount);
                emit StakeWithdrawn(staker, amount);
            }
        }
        
        // Reset total staked
        eventDetails.totalStaked = 0;
    }

    function getEventDetails() external view returns (
        string memory question,
        string memory description,
        string[] memory options,
        string memory eventType,
        string memory category,
        string memory eventImage,
        EventStatus status,
        uint256 endTime,
        uint8 winningOption,
        address creator,
        address tokenAddress,
        uint256 totalStaked,
        uint256 creatorFeePercentage,
        bool creatorRewardClaimed
    ) {
        return (
            eventDetails.question,
            eventDetails.description,
            eventDetails.options,
            eventDetails.eventType,
            eventDetails.category,
            eventDetails.eventImage,
            eventDetails.status,
            eventDetails.endTime,
            eventDetails.winningOption,
            eventDetails.creator,
            eventDetails.tokenAddress,
            eventDetails.totalStaked,
            eventDetails.creatorFeePercentage,
            eventDetails.creatorRewardClaimed
        );
    }

    function getNullificationReason() external view returns (string memory) {
        return eventDetails.nullificationReason;
    }

    function getStakersCount() external view returns (uint256) {
        return stakers.length;
    }

    function getUserStake(address _user) external view returns (
        uint8 selectedOption,
        uint256 amount,
        bool claimed
    ) {
        UserStake memory userStake = userStakes[_user];
        return (userStake.selectedOption, userStake.amount, userStake.claimed);
    }

    function getOptionTotals() external view returns (uint256[] memory) {
        return optionTotals;
    }
}