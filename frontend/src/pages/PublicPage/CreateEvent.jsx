import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAccount,
  useChainId,
  useConfig,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useBalance,
  useSwitchChain,
} from "wagmi";
import { readContract } from "wagmi/actions";
import { toast } from "react-toastify";
import { isAddress, formatUnits, parseUnits } from "viem";
import Flames from "../../assets/images/svgs/flames.svg";
import CUSD from "../../assets/images/pngs/cUSD.png";
import USDC from "../../assets/images/svgs/USDC.svg";
import STIM from "../../assets/images/svgs/stim-coin.svg";
import { celoSepolia } from "../../wagmi/config";

// Components
import StepsIndicator from "../../components/StepsIndicator";
import FormNavigation from "../../components/FormNavigation";
import FAQSection from "../../components/FAQSection";
import EventDetailsForm from "../../components/forms/EventDetailsForm";
import CategoryTypeForm from "../../components/forms/CategoryTypeForm";
import TimeTokenForm from "../../components/forms/TimeTokenForm";

// Constants - UPDATED TO MAINNET FACTORY ADDRESS
import { getChainName } from "../../utils/chainUtils";
import stakingABI from "../../deployedContract/abi/Preden.json";

// Factory contract address
const MAINNET_FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS || import.meta.env.REACT_APP_PVP_CONTRACT_ADDRESS;

// ERC20 ABI for token approval
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

// Token configuration
const STAKING_TOKENS = [
  {
    address: import.meta.env.VITE_USDC_ADDRESS,
    symbol: "USDC",
    icon: USDC,
    decimals: 6,
  },
  {
    address: import.meta.env.VITE_CUSD_ADDRESS,
    symbol: "cUSD",
    icon: CUSD,
    decimals: 18,
  },
];

console.log("staking", STAKING_TOKENS);

// CUSD token address for creator fees (always CUSD)
const CREATOR_FEE_TOKEN = import.meta.env.VITE_CUSD_ADDRESS;

// Define supported networks
const SUPPORTED_NETWORKS = [11142220];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const config = useConfig();

  // Get ETH balance for gas fee checks
  const { data: ethBalance } = useBalance({
    address: address,
    enabled: !!address,
  });

  // Get chain info
  const chain = config.chains.find((c) => c.id === chainId) || {
    id: chainId,
    name: "Unknown",
  };

  const [step, setStep] = useState(1);
  const [transactionState, setTransactionState] = useState({
    loading: false,
    currentStep: null,
    error: null,
  });
  const [formError, setFormError] = useState("");
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState({});
  const [categoryList, setCategoryList] = useState([]);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [currentChainName, setCurrentChainName] = useState("");
  const [hasTokenApproval, setHasTokenApproval] = useState(false);
  const [networkChanged, setNetworkChanged] = useState(false);
  const [allowedTokens, setAllowedTokens] = useState([]);

  // Check if current user is an admin - UPDATED TO USE MAINNET FACTORY
  const { data: isAdmin, refetch: refetchAdminStatus } = useReadContract({
    address: MAINNET_FACTORY_ADDRESS,
    abi: stakingABI,
    functionName: "hasRole",
    args: [
      import.meta.env.VITE_ADMIN_ROLE_HASH,
      address,
    ],
    enabled: !!address && chainId === celoSepolia.id,
  });

  // Check if current user is a moderator - UPDATED TO USE MAINNET FACTORY
  const { data: isModerator, refetch: refetchModeratorStatus } =
    useReadContract({
      address: MAINNET_FACTORY_ADDRESS,
      abi: stakingABI,
      functionName: "hasRole",
      args: [
        import.meta.env.VITE_MODERATOR_ROLE_HASH,
        address,
      ],
      enabled: !!address && chainId === celoSepolia.id,
    });

  // Determine if user is exempt from creator stake
  const isAdminOrModerator = Boolean(isAdmin || isModerator);

  // Form state - UPDATED TO USE CUSD MAINNET AS DEFAULT
  const [formData, setFormData] = useState({
    question: "",
    description: "",
    options: ["Yes", "No"],
    eventType: "public",
    categoryId: "0",
    eventImage: "",
    endTime: "",
    tokenAddress: "",
  });

  // Contract read hooks - UPDATED TO USE MAINNET FACTORY
  const {
    data: categories,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useReadContract({
    address: MAINNET_FACTORY_ADDRESS,
    abi: stakingABI,
    functionName: "getAllCategories",
    enabled: chainId === celoSepolia.id,
  });

  const { data: creatorStakeAmount } = useReadContract({
    address: MAINNET_FACTORY_ADDRESS,
    abi: stakingABI,
    functionName: "creatorStakeAmount",
    enabled: chainId === celoSepolia.id,
  });

  const { data: defaultCreatorFeePercentage } = useReadContract({
    address: MAINNET_FACTORY_ADDRESS,
    abi: stakingABI,
    functionName: "defaultCreatorFeePercentage",
    enabled: chainId === celoSepolia.id,
  });

  // Check staking token balance (user's choice)
  const { data: stakingTokenBalance } = useReadContract({
    address: formData.tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled:
      !!address && !!formData.tokenAddress && isAddress(formData.tokenAddress),
  });

  // Check STIM token allowance for creator fee (separate from staking token)
  const { data: stimTokenAllowance, refetch: refetchStimAllowance } = useReadContract({
    address: CREATOR_FEE_TOKEN,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && MAINNET_FACTORY_ADDRESS ? [address, MAINNET_FACTORY_ADDRESS] : undefined,
    enabled: !!address && !isAdminOrModerator,
  })

  // Check staking token decimals
  const { data: stakingTokenDecimals } = useReadContract({
    address: formData.tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    enabled: !!formData.tokenAddress && isAddress(formData.tokenAddress),
  });

  // Token approval for STIM creator fee
  const {
    writeContract: approveStimToken,
    isPending: isStimApprovalLoading,
    data: stimApprovalHash,
    error: stimApprovalError,
  } = useWriteContract()

  // Wait for STIM approval transaction
  const { isSuccess: isStimApprovalSuccess } = useWaitForTransactionReceipt({
    hash: stimApprovalHash,
  })

  // Event creation
  const {
    writeContract: createEvent,
    isPending: isCreateLoading,
    data: createEventHash,
    error: createEventError,
  } = useWriteContract();

  // Wait for event creation transaction
  const { isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({
    hash: createEventHash,
  });

  // Set up allowed staking tokens for Celo Sepolia
  useEffect(() => {
    if (chainId === celoSepolia.id) {
      setAllowedTokens(STAKING_TOKENS);
    } else {
      setAllowedTokens(STAKING_TOKENS);
    }
  }, [chainId]);

  // Check STIM token allowance for creator fee
  useEffect(() => {
    if (isAdminOrModerator) {
      setHasTokenApproval(true)
    } else if (stimTokenAllowance && creatorStakeAmount) {
      const hasEnoughStimAllowance = BigInt(stimTokenAllowance) >= BigInt(creatorStakeAmount)
      setHasTokenApproval(hasEnoughStimAllowance)
    } else {
      setHasTokenApproval(false)
    }
  }, [stimTokenAllowance, creatorStakeAmount, isAdminOrModerator])

  // Track network changes
  useEffect(() => {
    if (chainId) {
      const chainName = getChainName(chainId);
      setCurrentChainName(chainName);

      if (!transactionState.loading) {
        setNetworkChanged(false);
      } else {
        setNetworkChanged(true);
      }
    }
  }, [chainId]);

  // Check supported network and enforce switch
  useEffect(() => {
    const enforceNetwork = async () => {
      if (isConnected && chainId && chainId !== celoSepolia.id) {
        try {
          // Only attempt to switch if we haven't just tried (avoid loops)
          // But for "enforce", we usually want to be aggressive or show UI
          console.log("Wrong network detected. Requesting switch to Celo Sepolia...");
          await switchChain({ chainId: celoSepolia.id });
        } catch (error) {
          console.error("Failed to switch network:", error);
          toast.error("Please switch your wallet to Celo Sepolia to continue.");
        }
      }
    };

    enforceNetwork();
  }, [isConnected, chainId, switchChain]);



  // Process categories
  useEffect(() => {
    if (categories && categories.length > 0) {
      const formattedCategories = categories.map((category, index) => ({
        id: index.toString(),
        name: category?.name || `Category ${index}`,
        description: category?.description || "",
        active: category?.active !== false,
      }));

      setCategoryList(formattedCategories);
      setIsUsingFallbackData(false);

      if (
        !formData.categoryId ||
        Number(formData.categoryId) >= formattedCategories.length
      ) {
        setFormData((prev) => ({
          ...prev,
          categoryId: "0",
        }));
      }
    } else if (categoriesError || chainId !== celoSepolia.id) {
      console.log(categoriesError, categories)
      const mockCategories = [
        {
          id: "0",
          name: "Sports",
          description: "Sports predictions",
          active: true,
        },
        {
          id: "1",
          name: "Crypto",
          description: "Cryptocurrency events",
          active: true,
        },
      ];
      setCategoryList(mockCategories);
      setIsUsingFallbackData(true);
      if (chainId !== celoSepolia.id) {
        toast.warn("Using fallback categories - please switch to Celo Sepolia");
      }
    }
  }, [categories, categoriesError, chainId]);

  // Handle STIM approval success
  useEffect(() => {
    if (isStimApprovalSuccess) {
      refetchStimAllowance()
      setTransactionState((prev) => ({
        ...prev,
        currentStep: null,
        loading: false,
      }))
      toast.success("STIM creator fee approval confirmed!")

      setTimeout(() => {
        handleEventCreation()
      }, 1000)
    }
  }, [isStimApprovalSuccess])

  // Handle STIM approval errors
  useEffect(() => {
    if (stimApprovalError) {
      console.error("STIM approval error:", stimApprovalError)
      let errorMessage = "STIM creator fee approval failed"

      if (stimApprovalError.message.includes("insufficient funds")) {
        errorMessage = "Low CELO balance. You need CELO for gas fees."
      } else if (stimApprovalError.message.includes("gas required exceeds allowance")) {
        errorMessage = "Low CELO balance. You need CELO for gas fees."
      } else if (stimApprovalError.message.includes("execution reverted")) {
        errorMessage = "Transaction reverted - check STIM token contract and balance"
      }

      setTransactionState({
        loading: false,
        currentStep: null,
        error: errorMessage,
      })
      toast.error(errorMessage)
    }
  }, [stimApprovalError])

  // Handle create event errors
  useEffect(() => {
    if (createEventError) {
      console.error("Create event error:", createEventError);
      let errorMessage = "Event creation failed" + createEventError.message;

      if (
        createEventError.message.includes("User rejected") ||
        createEventError.message.includes("User denied")
      ) {
        errorMessage = "Event creation cancelled";
      } else if (createEventError.message.includes("insufficient funds")) {
        errorMessage = "Low CELO balance. You need CELO for gas fees.";
      } else if (
        createEventError.message.includes("gas required exceeds allowance")
      ) {
        errorMessage = "Low CELO balance. You need CELO for gas fees.";
      } else if (createEventError.message.includes("execution reverted")) {
        errorMessage = "Transaction reverted - check your inputs and try again";
      }

      setTransactionState({
        loading: false,
        currentStep: null,
        error: errorMessage,
      });

      if (
        createEventError.message.includes("User rejected") ||
        createEventError.message.includes("User denied")
      ) {
        toast.info(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  }, [createEventError]);

  // Handle successful event creation
  useEffect(() => {
    if (isCreateSuccess) {
      const newEvent = {
        id: `new-${Date.now()}`,
        address: MAINNET_FACTORY_ADDRESS,
        question: formData.question,
        category: {
          name:
            categoryList.find((cat) => cat.id === formData.categoryId)?.name ||
            "General",
          id: formData.categoryId,
        },
        options: {
          A: formData.options[0] || "Yes",
          B: formData.options[1] || "No",
        },
        end_time: formData.endTime,
        additional_info: formData.description,
      };

      toast.success("Event created successfully!");
      navigate("/predict");
      setTransactionState({
        loading: false,
        currentStep: null,
        error: null,
      });
    }
  }, [isCreateSuccess, navigate, formData, categoryList]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle options changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  // Add option
  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({ ...formData, options: [...formData.options, ""] });
    }
  };

  // Remove option
  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({ ...formData, options: newOptions });
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    const numericCategoryId = Number(categoryId);
    if (isNaN(numericCategoryId) || numericCategoryId >= categoryList.length) {
      toast.warn("Invalid category ID. Using default category.");
      setFormData({ ...formData, categoryId: "0" });
    } else {
      setFormData({ ...formData, categoryId: categoryId });
    }
    setShowCategoryDropdown(false);
  };

  // Handle staking token selection
  const handleTokenSelect = (tokenAddress) => {
    setFormData({ ...formData, tokenAddress });
    setShowTokenDropdown(false);
  };

  // Get category name
  const getCategoryName = (id) => {
    const category = categoryList.find((cat) => cat.id === id);
    return category ? category.name : "Select Category";
  };

  // Get token info for staking tokens
  const getTokenInfo = (address) => {
    return allowedTokens.find((token) => token.address === address);
  };

  // Toggle info tooltip
  const toggleInfoTooltip = (key) => {
    setShowInfoTooltip({
      ...showInfoTooltip,
      [key]: !showInfoTooltip[key],
    });
  };

  // Handle event creation
  const handleEventCreation = async () => {
    try {
      const numericCategoryId = Number(formData.categoryId);

      if (isNaN(numericCategoryId)) {
        throw new Error("Invalid category selected");
      }

      if (!isAddress(formData.tokenAddress)) {
        throw new Error("Invalid staking token address");
      }

      setTransactionState({
        loading: true,
        currentStep: "creating",
        error: null,
      });

      toast.info("Creating event...");

      const endTimeUnix = Math.floor(
        new Date(formData.endTime).getTime() / 1000
      );

      await createEvent({
        address: MAINNET_FACTORY_ADDRESS,
        abi: stakingABI,
        functionName: "createEvent",
        args: [
          formData.question,
          formData.description,
          formData.options,
          formData.eventType,
          numericCategoryId,
          formData.eventImage || "",
          endTimeUnix,
          formData.tokenAddress,
        ],
        gas: 3000000n,
        feeCurrency: import.meta.env.VITE_CUSD_ADDRESS,
      });
    } catch (error) {
      console.error("Event creation failed:", error);
      let errorMessage = "Event creation failed";

      if (
        error.message.includes("User rejected") ||
        error.message.includes("User denied")
      ) {
        errorMessage = "Event creation cancelled";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Low CELO balance. You need CELO for gas fees.";
      } else if (error.message.includes("gas required exceeds allowance")) {
        errorMessage = "Low CELO balance. You need CELO for gas fees.";
      } else {
        errorMessage = `Event creation failed: ${error.message}`;
      }

      setFormError(errorMessage);
      setTransactionState({
        loading: false,
        currentStep: null,
        error: errorMessage,
      });

      if (
        error.message.includes("User rejected") ||
        error.message.includes("User denied")
      ) {
        toast.info(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Unified transaction handler
  const handleTransaction = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!isConnected) {
      setFormError("Please connect your wallet first");
      toast.error("Wallet not connected");
      return;
    }

    if (chainId !== celoSepolia.id) {
      try {
        await switchChain({ chainId: celoSepolia.id });
        return; // Return and let the user click again after switching
      } catch (error) {
        setFormError("Please switch to Celo Sepolia");
        toast.error("Failed to switch network. Please switch manually.");
        return;
      }
    }

    // Validation
    const validationErrors = [];
    if (!formData.question.trim())
      validationErrors.push("Question is required");
    if (!formData.description.trim())
      validationErrors.push("Description is required");
    if (formData.options.some((opt) => !opt.trim()))
      validationErrors.push("All options must have a value");
    if (!formData.endTime) validationErrors.push("End time is required");
    if (!formData.tokenAddress)
      validationErrors.push("Please select a staking token");

    const isValidStakingToken = STAKING_TOKENS.some(
      (token) => token.address === formData.tokenAddress
    );
    if (!isValidStakingToken) {
      validationErrors.push(
        "Please select a valid staking token (USDC or CUSD)"
      );
    }

    const endTime = new Date(formData.endTime);
    const now = new Date();
    if (endTime <= now) {
      validationErrors.push("End time must be in the future");
    }

    if (validationErrors.length > 0) {
      setFormError(validationErrors[0]);
      return;
    }

    try {
      setNetworkChanged(false);

      await handleEventCreation();
    } catch (error) {
      console.error("Transaction process failed:", error);
      setFormError(error.message);
    }
  };

  // Navigation functions
  const goToNextStep = () => {
    if (step === 1) {
      const validationErrors = [];
      if (!formData.question.trim())
        validationErrors.push("Question is required");
      if (!formData.description.trim())
        validationErrors.push("Description is required");
      if (formData.options.some((opt) => !opt.trim()))
        validationErrors.push("All options must have a value");

      if (validationErrors.length > 0) {
        setFormError(validationErrors[0]);
        return;
      }
    }
    setFormError("");
    setStep(step + 1);
  };

  const goToPrevStep = () => {
    setFormError("");
    setStep(step - 1);
  };

  // Get button text based on current transaction state and admin status
  const getButtonText = () => {
    const { loading, currentStep } = transactionState;

    if (loading) {
      if (currentStep === "creating") return "Creating Event...";
      return "Processing...";
    }

    if (isCreateLoading) return "Confirming Transaction...";

    return "Create Event";
  };

  // Format stake amount for display
  const formatStakeAmount = (amount) => {
    if (!amount) return "Loading...";

    try {
      const formatted = formatUnits(BigInt(amount), 18);
      return parseFloat(formatted).toLocaleString();
    } catch (error) {
      console.error("Error formatting stake amount:", error);
      return "Loading...";
    }
  };

  const formatFeePercentage = (percentage) => {
    if (!percentage) return "Loading...";
    return `${Number(percentage) / 100}%`;
  };

  // If connected but on wrong network, show blocking UI or warning
  if (isConnected && chainId && chainId !== celoSepolia.id) {
    console.log("Current Chain:", chainId, "Target Chain:", celoSepolia.id);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div className="p-8 text-center bg-gray-800 rounded-lg shadow-xl">
          <h2 className="mb-4 text-2xl font-bold text-red-500">Wrong Network</h2>
          <p className="mb-6">Please switch to Celo Sepolia to create an event.</p>
          <button
            onClick={async () => {
              try {
                console.log("Manually switching to Celo Sepolia...", celoSepolia.id);
                await switchChain({ chainId: celoSepolia.id });
              } catch (error) {
                console.error("Manual switch failed:", error);
                toast.error(`Switch failed: ${error.message}`);
              }
            }}
            className="px-6 py-3 font-bold text-black transition-colors rounded-full bg-cyan-400 hover:bg-cyan-300"
          >
            Switch to Celo Sepolia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 md:p-6 lg:p-8">
      <div className="fixed bottom-0 left-0 w-full h-[700px] md:h-screen -z-10">
        <img
          src={Flames || "/placeholder.svg"}
          alt="background"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="relative z-0 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold md:text-xl lg:text-2xl text-cyan-400">
              CREATE EVENT
            </span>
            <div className="px-2 py-1 text-xs text-green-300 bg-green-500 border border-green-500 rounded bg-opacity-20">
              Celo Sepolia
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 transition-colors border rounded-lg text-cyan-400 border-cyan-400 hover:bg-cyan-900 hover:bg-opacity-20"
          >
            Back
          </button>
        </div>

        {/* {isConnected && isAdminOrModerator && (
          <div className="p-3 mb-6 text-green-300 bg-green-500 border border-green-500 rounded-lg bg-opacity-20">
            <p className="font-medium">
              {isAdmin ? "Admin" : "Moderator"} Account Detected
              <br />
              You can create events without paying the creator fee in Preden
              tokens!
            </p>
          </div>
        )} */}

        {/*isConnected && !isAdminOrModerator && stimTokenBalance && creatorStakeAmount && BigInt(stimTokenBalance) < BigInt(creatorStakeAmount) && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-3 rounded-lg mb-6">
            <p className="font-medium">
              Insufficient STIM balance for creator fee. 
              <br />
              Required: {formatStakeAmount(creatorStakeAmount)} STIM | 
              Your Balance: {formatUnits(BigInt(stimTokenBalance), 18)} STIM
            </p>
          </div>
        )*/}

        {isUsingFallbackData && (
          <div className="p-3 mb-6 text-yellow-300 bg-yellow-500 border border-yellow-500 rounded-lg bg-opacity-20">
            <p className="font-medium">
              Using demo content for development. Please connect to the correct
              network for actual contract interaction.
            </p>
          </div>
        )}

        <div
          className="p-[2px] rounded-2xl max-w-3xl mx-auto"
          style={{
            background: "linear-gradient(135deg, #195281, #09113B)",
          }}
        >
          <div className="bg-[#09113B] rounded-2xl p-6 min-h-[500px]">
            <StepsIndicator step={step} />

            {formError && (
              <div className="p-3 mb-4 text-red-300 bg-red-500 border border-red-500 rounded-lg bg-opacity-20">
                <p className="font-medium">{formError}</p>
              </div>
            )}

            {transactionState.error && (
              <div className="p-3 mb-4 text-red-300 bg-red-500 border border-red-500 rounded-lg bg-opacity-20">
                <p className="font-medium">Error: {transactionState.error}</p>
              </div>
            )}

            <form onSubmit={handleTransaction}>
              {step === 1 && (
                <>
                  <EventDetailsForm
                    formData={formData}
                    handleChange={handleChange}
                    handleOptionChange={handleOptionChange}
                    addOption={addOption}
                    removeOption={removeOption}
                    toggleInfoTooltip={toggleInfoTooltip}
                    showInfoTooltip={showInfoTooltip}
                  />
                  <FormNavigation
                    step={step}
                    goToNextStep={goToNextStep}
                    isLastStep={false}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <CategoryTypeForm
                    formData={formData}
                    setFormData={setFormData}
                    categoryList={categoryList}
                    isUsingFallbackData={isUsingFallbackData}
                    refetchCategories={refetchCategories}
                    toggleInfoTooltip={toggleInfoTooltip}
                    showInfoTooltip={showInfoTooltip}
                    showCategoryDropdown={showCategoryDropdown}
                    setShowCategoryDropdown={setShowCategoryDropdown}
                    getCategoryName={getCategoryName}
                    handleCategorySelect={handleCategorySelect}
                  />
                  <FormNavigation
                    step={step}
                    goToPrevStep={goToPrevStep}
                    goToNextStep={goToNextStep}
                    isLastStep={false}
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <TimeTokenForm
                    formData={formData}
                    handleChange={handleChange}
                    toggleInfoTooltip={toggleInfoTooltip}
                    showInfoTooltip={showInfoTooltip}
                    showTokenDropdown={showTokenDropdown}
                    setShowTokenDropdown={setShowTokenDropdown}
                    getTokenInfo={getTokenInfo}
                    handleTokenSelect={handleTokenSelect}
                    TOKENS={allowedTokens}
                    isSubmitting={transactionState.loading}
                    creatorStakeAmount={formatStakeAmount(creatorStakeAmount)}
                    defaultCreatorFeePercentage={formatFeePercentage(
                      defaultCreatorFeePercentage
                    )}
                    isAdminOrModerator={isAdminOrModerator}
                  />

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={goToPrevStep}
                      className="px-6 py-2 text-white transition-colors bg-transparent border rounded-lg border-white/20 hover:bg-white/10"
                      disabled={transactionState.loading || isCreateLoading}
                    >
                      Previous
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-[#195281] text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        transactionState.loading ||
                        isCreateLoading ||
                        chainId !== celoSepolia.id
                      }
                    >
                      {getButtonText()}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>

        <FAQSection />
      </div>
    </div>
  );
};

export default CreateEvent;
