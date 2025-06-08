import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, ExternalLink, CheckCircle } from 'lucide-react';

/**
 * Component that helps users connect their Airbnb listings via Hospitable
 */
export function AirbnbListingsImporter() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'auth' | 'success'>('form');

  // Mutation to create customer and generate auth URL
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const response = await apiRequest('POST', '/api/hospitable/connect?action=customer', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Customer created successfully:', data);
      setAuthUrl(data.authUrl);
      setStep('auth');
      toast({
        title: 'Customer account created!',
        description: 'Please complete the authorization process to connect your Airbnb listings.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating customer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      toast({
        title: 'Missing information',
        description: 'Please provide both your name and email',
        variant: 'destructive',
      });
      return;
    }

    createCustomerMutation.mutate({ email, name });
  };

  const handleFinishAuth = () => {
    setStep('success');
    toast({
      title: 'Airbnb sync complete!',
      description: 'Your Airbnb listings are now connected to your StayDirectly account.',
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Connect your Airbnb listings</CardTitle>
        <CardDescription>
          Import your Airbnb properties to StayDirectly using the Hospitable integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Connect with Airbnb'
              )}
            </Button>
          </form>
        )}

        {step === 'auth' && authUrl && (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center mb-4">
              <p className="mb-2">Your account has been created!</p>
              <p className="text-sm text-gray-500">
                Click the button below to authorize access to your Airbnb listings. You'll be redirected to Hospitable to complete this process.
              </p>
            </div>
            <a 
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button>
                Authorize Connection
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleFinishAuth}
            >
              I've completed authorization
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-xl font-medium">Successfully Connected!</h3>
            <p className="text-gray-600">
              Your Airbnb listings have been successfully connected to StayDirectly. They will be automatically imported and optimized for direct bookings.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4 mt-2">
        <p className="text-xs text-gray-500 text-center">
          Powered by Hospitable. We never store your Airbnb credentials.
        </p>
      </CardFooter>
    </Card>
  );
}