import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { onboardingFlow, OnboardingFlowStatus } from '@/lib/hospitable/onboarding-flow';
import { useToast } from '@/hooks/use-toast';

const STEP_DESCRIPTIONS = {
  [OnboardingFlowStatus.NOT_STARTED]: 'Starting the onboarding flow...',
  [OnboardingFlowStatus.CUSTOMER_CREATED]: 'Customer account created in Hospitable',
  [OnboardingFlowStatus.AUTH_LINK_GENERATED]: 'Authorization link generated',
  [OnboardingFlowStatus.AUTHORIZED]: 'Successfully authorized with Hospitable',
  [OnboardingFlowStatus.LISTINGS_FETCHED]: 'Property listings fetched from Hospitable',
  [OnboardingFlowStatus.LISTINGS_STORED]: 'Property listings stored in database',
  [OnboardingFlowStatus.IMAGES_FETCHED]: 'Property images fetched and stored',
  [OnboardingFlowStatus.COMPLETED]: 'Onboarding process completed successfully',
  [OnboardingFlowStatus.ERROR]: 'An error occurred during onboarding'
};

export function useOnboardingFlow() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingFlowStatus>(
    onboardingFlow.getState().status
  );
  
  // Load the current state from localStorage on mount
  const flowState = onboardingFlow.getState();
  
  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      setCurrentStep(OnboardingFlowStatus.NOT_STARTED);
      const customerId = await onboardingFlow.createCustomer(customerData);
      setCurrentStep(OnboardingFlowStatus.CUSTOMER_CREATED);
      return customerId;
    },
    onSuccess: (customerId) => {
      toast({
        title: 'Customer Created',
        description: `Customer created with ID: ${customerId}`,
      });
    },
    onError: (error: Error) => {
      setCurrentStep(OnboardingFlowStatus.ERROR);
      toast({
        title: 'Error Creating Customer',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Generate authorization link mutation
  const generateAuthLinkMutation = useMutation({
    mutationFn: async (customerId: string) => {
      setCurrentStep(OnboardingFlowStatus.CUSTOMER_CREATED);
      const authLink = await onboardingFlow.generateAuthLink(customerId);
      setCurrentStep(OnboardingFlowStatus.AUTH_LINK_GENERATED);
      return authLink;
    },
    onSuccess: (authLink) => {
      toast({
        title: 'Auth Link Generated',
        description: 'Authorization link generated successfully',
      });
    },
    onError: (error: Error) => {
      setCurrentStep(OnboardingFlowStatus.ERROR);
      toast({
        title: 'Error Generating Auth Link',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Fetch listings mutation
  const fetchListingsMutation = useMutation({
    mutationFn: async (customerId: string) => {
      setCurrentStep(OnboardingFlowStatus.AUTHORIZED);
      const listings = await onboardingFlow.fetchListings(customerId);
      setCurrentStep(OnboardingFlowStatus.LISTINGS_FETCHED);
      return listings;
    },
    onSuccess: (listings) => {
      toast({
        title: 'Listings Fetched',
        description: `Successfully fetched ${listings.length} listings`,
      });
    },
    onError: (error: Error) => {
      setCurrentStep(OnboardingFlowStatus.ERROR);
      toast({
        title: 'Error Fetching Listings',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Store listings mutation
  const storeListingsMutation = useMutation({
    mutationFn: async (customerId: string) => {
      setCurrentStep(OnboardingFlowStatus.LISTINGS_FETCHED);
      const result = await onboardingFlow.storeListings(customerId);
      setCurrentStep(OnboardingFlowStatus.LISTINGS_STORED);
      return result;
    },
    onSuccess: (properties) => {
      toast({
        title: 'Listings Stored',
        description: `Successfully stored ${properties.length} properties`,
      });
    },
    onError: (error: Error) => {
      setCurrentStep(OnboardingFlowStatus.ERROR);
      toast({
        title: 'Error Storing Listings',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Fetch images mutation
  const fetchImagesMutation = useMutation({
    mutationFn: async (customerId: string) => {
      setCurrentStep(OnboardingFlowStatus.LISTINGS_STORED);
      const result = await onboardingFlow.fetchListingImages(customerId);
      setCurrentStep(OnboardingFlowStatus.IMAGES_FETCHED);
      return result;
    },
    onSuccess: (success) => {
      if (success) {
        toast({
          title: 'Images Fetched',
          description: 'Successfully fetched property images',
        });
      } else {
        toast({
          title: 'Image Fetch Incomplete',
          description: 'Some images could not be fetched',
          variant: 'warning',
        });
      }
    },
    onError: (error: Error) => {
      setCurrentStep(OnboardingFlowStatus.ERROR);
      toast({
        title: 'Error Fetching Images',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Publish properties mutation
  const publishPropertiesMutation = useMutation({
    mutationFn: async (customerId: string) => {
      setCurrentStep(OnboardingFlowStatus.IMAGES_FETCHED);
      const result = await onboardingFlow.publishProperties(customerId);
      setCurrentStep(OnboardingFlowStatus.COMPLETED);
      return result;
    },
    onSuccess: (success) => {
      if (success) {
        toast({
          title: 'Properties Published',
          description: 'Properties are now live on the site',
        });
      }
    },
    onError: (error: Error) => {
      setCurrentStep(OnboardingFlowStatus.ERROR);
      toast({
        title: 'Error Publishing Properties',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Run full flow mutation
  const runFullFlowMutation = useMutation({
    mutationFn: async (customerData: any) => {
      setCurrentStep(OnboardingFlowStatus.NOT_STARTED);
      return await onboardingFlow.runFullFlow(customerData);
    },
    onSuccess: (success) => {
      if (success) {
        setCurrentStep(OnboardingFlowStatus.COMPLETED);
        toast({
          title: 'Onboarding Completed',
          description: 'The onboarding process completed successfully',
        });
      } else {
        setCurrentStep(OnboardingFlowStatus.ERROR);
        toast({
          title: 'Onboarding Failed',
          description: 'The onboarding process could not be completed',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      setCurrentStep(OnboardingFlowStatus.ERROR);
      toast({
        title: 'Onboarding Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Reset the flow
  const resetFlow = useCallback(() => {
    onboardingFlow.reset();
    setCurrentStep(OnboardingFlowStatus.NOT_STARTED);
    toast({
      title: 'Flow Reset',
      description: 'The onboarding flow has been reset',
    });
  }, [toast]);
  
  return {
    // Current state
    currentStep,
    currentStepDescription: STEP_DESCRIPTIONS[currentStep],
    flowState,
    
    // Mutations for individual steps
    createCustomerMutation,
    generateAuthLinkMutation,
    fetchListingsMutation,
    storeListingsMutation,
    fetchImagesMutation,
    publishPropertiesMutation,
    
    // Full flow mutation
    runFullFlowMutation,
    
    // Other utilities
    resetFlow,
    
    // Progress indicators
    isLoading: 
      createCustomerMutation.isPending || 
      generateAuthLinkMutation.isPending || 
      fetchListingsMutation.isPending ||
      storeListingsMutation.isPending ||
      fetchImagesMutation.isPending ||
      publishPropertiesMutation.isPending ||
      runFullFlowMutation.isPending,
      
    isError:
      createCustomerMutation.isError || 
      generateAuthLinkMutation.isError || 
      fetchListingsMutation.isError ||
      storeListingsMutation.isError ||
      fetchImagesMutation.isError ||
      publishPropertiesMutation.isError ||
      runFullFlowMutation.isError ||
      currentStep === OnboardingFlowStatus.ERROR,
      
    error:
      createCustomerMutation.error || 
      generateAuthLinkMutation.error || 
      fetchListingsMutation.error ||
      storeListingsMutation.error ||
      fetchImagesMutation.error ||
      publishPropertiesMutation.error ||
      runFullFlowMutation.error,
      
    isComplete: currentStep === OnboardingFlowStatus.COMPLETED
  };
}