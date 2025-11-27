import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import PVP_ABI from '../../src/deployedContract/abi/PVP_ABI.json';

export const usePVPContract = () => {
  const { address } = useAccount();
  const pvpContractAddress = process.env.REACT_APP_PVP_CONTRACT_ADDRESS;

  // Get all events
  const { data: allEvents, refetch: refetchAllEvents, isLoading: loadingEvents } = useContractRead({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'getAllEvents',
    enabled: !!pvpContractAddress,
  });

  // Get all categories
  const { data: categories, refetch: refetchCategories, isLoading: loadingCategories } = useContractRead({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'getAllCategories',
    enabled: !!pvpContractAddress,
  });

  // Get events count
  const { data: eventsCount } = useContractRead({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'getEventsCount',
    enabled: !!pvpContractAddress,
  });

  // Get categories count
  const { data: categoriesCount } = useContractRead({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'getCategoriesCount',
    enabled: !!pvpContractAddress,
  });

  // Get creator stake amount
  const { data: creatorStakeAmount } = useContractRead({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'creatorStakeAmount',
    enabled: !!pvpContractAddress,
  });

  // Get default creator fee percentage
  const { data: defaultCreatorFeePercentage } = useContractRead({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'defaultCreatorFeePercentage',
    enabled: !!pvpContractAddress,
  });

  // Create a new event
  const { config: createEventConfig, error: prepareError } = usePrepareContractWrite({
    address: pvpContractAddress,
    abi: PVP_ABI,
    functionName: 'createEvent',
    enabled: !!pvpContractAddress,
  });

  const { 
    write: createEvent, 
    isLoading: isCreatingEvent, 
    isSuccess: isCreateSuccess,
    error: createError 
  } = useContractWrite({
    ...createEventConfig,
    onSuccess: () => {
      setTimeout(() => refetchAllEvents(), 5000);
    },
  });

  // Custom hooks for filtered data
  const useEventsByCategory = (categoryId) => {
    return useContractRead({
      address: pvpContractAddress,
      abi: PVP_ABI,
      functionName: 'getEventsByCategory',
      args: [categoryId],
      enabled: !!pvpContractAddress && categoryId !== undefined && categoryId !== null,
    });
  };

  const useEventsByStatus = (status) => {
    return useContractRead({
      address: pvpContractAddress,
      abi: PVP_ABI,
      functionName: 'getEventsByStatus',
      args: [status],
      enabled: !!pvpContractAddress && status !== undefined && status !== null,
    });
  };

  const useEventsByCreator = (creatorAddress) => {
    return useContractRead({
      address: pvpContractAddress,
      abi: PVP_ABI,
      functionName: 'getEventsByCreator',
      args: [creatorAddress],
      enabled: !!pvpContractAddress && !!creatorAddress,
    });
  };

  // Helper function to create an event
  const handleCreateEvent = async (eventParams) => {
    try {
      if (!createEvent) {
        throw new Error('Contract write function not available');
      }

      const {
        question,
        description,
        options,
        eventType,
        categoryId,
        eventImage,
        endTime,
        tokenAddress
      } = eventParams;

      await createEvent({
        args: [
          question,
          description,
          options,
          eventType,
          categoryId,
          eventImage,
          endTime,
          tokenAddress
        ]
      });

      return { success: true, message: 'Event creation transaction sent' };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, message: error.message || 'Failed to create event' };
    }
  };

  // Get contract stats
  const getContractStats = () => ({
    eventsCount: eventsCount?.toString() || '0',
    categoriesCount: categoriesCount?.toString() || '0',
    creatorStakeAmount: creatorStakeAmount?.toString() || '0',
    defaultCreatorFeePercentage: defaultCreatorFeePercentage?.toString() || '0',
  });

  return {
    // Data
    allEvents,
    categories,
    eventsCount,
    categoriesCount,
    creatorStakeAmount,
    defaultCreatorFeePercentage,

    // Loading states
    loadingEvents,
    loadingCategories,
    isCreatingEvent,

    // Success states
    isCreateSuccess,

    // Errors
    prepareError,
    createError,

    // Functions
    createEvent,
    handleCreateEvent,
    refetchAllEvents,
    refetchCategories,
    getContractStats,

    // Custom hooks (return these to be used in components)
    useEventsByCategory,
    useEventsByStatus,
    useEventsByCreator,
  };
};