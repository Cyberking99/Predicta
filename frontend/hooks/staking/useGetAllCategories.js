import { useReadContract } from 'wagmi';
 import STAKING_ABI from '../../src/deployedContract/abi/StakeABI.json';
import { STAKING } from '../../src/deployedContract/constants';

export const useGetAllCategories = () => {
  const { 
    data: categoriesData, 
    error, 
    isPending: isLoading, 
    refetch 
  } = useReadContract({
    address: STAKING,
    abi: STAKING_ABI,
    functionName: 'getAllCategories',
  });

  // Format the categories data
  const categories = categoriesData 
    ? categoriesData.map((category, index) => ({
        id: (index + 1).toString(),
        name: category.name,
        description: category.description,
        active: category.active
      }))
    : [];

  // Fallback mock data in case of error
  const mockCategories = [
    { id: "1", name: "Crypto", description: "Events related to cryptocurrency", active: true },
    { id: "2", name: "Sports", description: "Sports-related predictions", active: true },
    { id: "3", name: "Tech", description: "Technology trends and events", active: true },
    { id: "4", name: "Politics", description: "Political events and outcomes", active: true },
    { id: "5", name: "Economics", description: "Economic indicators and market trends", active: true },
  ];

  return { 
    categories: error ? mockCategories : categories, 
    isLoading, 
    isError: !!error,
    refetch
  };
};

export default useGetAllCategories;