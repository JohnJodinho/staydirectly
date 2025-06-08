import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HospitableConnect() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('');
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  // Get user's timezone when component mounts
  useEffect(() => {
    try {
      // Use Intl API to get the user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(userTimezone);
      console.log('Detected user timezone:', userTimezone);
    } catch (error) {
      console.error('Could not detect timezone:', error);
      // Fallback to a common timezone if detection fails
      setTimezone('America/New_York');
    }
  }, []);

  // Generate a 6-digit alphanumeric ID
  const generateSixDigitId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Create a Hospitable customer
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      // Generate a 6-digit alphanumeric ID
      const uniqueId = generateSixDigitId();
      
      // Format phone number with +1 country code
      const formattedPhone = phone ? `+1${phone}` : undefined;
      
      // Use detected timezone or fallback to America/New_York
      const userTimezone = timezone || 'America/New_York';
      
      const response = await apiRequest('POST', '/api/hospitable/connect?action=customer', {
        id: uniqueId, // Required by Hospitable API
        email,
        name,
        phone: formattedPhone, // Include +1 country code
        timezone: userTimezone, // Add timezone to request
        redirect_url: window.location.origin + '/auth/callback'
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Customer created successfully:', data);
      toast({
        title: 'Customer Created',
        description: 'Your Hospitable customer was created successfully',
      });
      setCustomerId(data.customer.id);
      setConnectUrl(data.authUrl);
    },
    onError: (error: any) => {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create customer',
        variant: 'destructive'
      });
    }
  });

  // Handle customer creation form submission
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !phone) {
      toast({
        title: 'Validation Error',
        description: 'Please provide name, email, and phone number',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate phone number format (10 digits for US)
    if (phone.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit US phone number',
        variant: 'destructive'
      });
      return;
    }
    
    createCustomerMutation.mutate();
  };

  // Handle OAuth window opening
  const handleConnect = () => {
    if (!connectUrl) return;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;
    
    const popup = window.open(
      connectUrl,
      'Connect with Hospitable',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for the auth code from the popup
    window.addEventListener('message', (event) => {
      // Handle the auth code
      if (event.data.code) {
        handleAuthCode(event.data.code);
        if (popup) popup.close();
      } else if (event.data.error) {
        toast({
          title: 'Authentication Error',
          description: event.data.error,
          variant: 'destructive'
        });
        if (popup) popup.close();
      }
    });
  };

  // Exchange auth code for tokens
  const handleAuthCode = async (code: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/hospitable/token', { code });
      const tokenData = await response.json();
      
      if (tokenData.access_token) {
        setConnected(true);
        toast({
          title: 'Connected Successfully',
          description: 'Your Hospitable account has been connected!',
        });
      }
    } catch (error) {
      console.error('Error exchanging auth code for tokens:', error);
      toast({
        title: 'Token Exchange Failed',
        description: 'Could not complete the authentication process',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Connect with Hospitable</CardTitle>
          <CardDescription>
            Connect your Hospitable account to import your Airbnb listings
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {connected ? (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Connected Successfully!</AlertTitle>
              <AlertDescription>
                Your Hospitable account has been connected. You can now import your listings.
              </AlertDescription>
            </Alert>
          ) : customerId ? (
            <div className="space-y-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Customer Created</AlertTitle>
                <AlertDescription>
                  Click the button below to connect your Hospitable account.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleConnect} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Connect with Hospitable
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-muted px-3 py-2 border border-r-0 rounded-l-md text-sm">
                    +1
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      // Strip any non-numeric characters
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setPhone(cleaned);
                    }}
                    className="rounded-l-none"
                    placeholder="9492907645"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  U.S. phone number (10 digits). Country code +1 will be added automatically.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={createCustomerMutation.isPending}
              >
                {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col items-start border-t pt-4 space-y-2 text-xs text-muted-foreground">
          <p>
            This will create a customer record in Hospitable and allow you to connect your Airbnb account.
          </p>
          <p>
            <span className="font-medium">How it works:</span> After creating a customer, you'll be redirected to Hospitable's authorization page where you can sign in and give permission to access your Airbnb listings.
          </p>
          <p>
            <span className="font-medium">Note:</span> A unique 6-digit alphanumeric ID (like "ABC123") will be automatically generated for your customer record.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}