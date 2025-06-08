import React, { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, addWeeks, isAfter } from 'date-fns';
import { hospitable } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

// Schedule weekly updates for a specific customer's listings
const DataRefreshScheduler: React.FC<{ customerId: string }> = ({ customerId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nextUpdateDate, setNextUpdateDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // On mount, check localStorage for the next scheduled update
  useEffect(() => {
    const storedDate = localStorage.getItem(`next-update-${customerId}`);
    if (storedDate) {
      const parsedDate = new Date(storedDate);
      // Validate the stored date - ensure it's in the future
      if (isAfter(parsedDate, new Date())) {
        setNextUpdateDate(parsedDate);
      } else {
        // If date is in the past, schedule a new one
        scheduleNextUpdate();
      }
    } else {
      // If not found, schedule the first update
      scheduleNextUpdate();
    }
  }, [customerId]);
  
  // Schedule next update (1 week from now)
  const scheduleNextUpdate = () => {
    const newUpdateDate = addWeeks(new Date(), 1);
    setNextUpdateDate(newUpdateDate);
    localStorage.setItem(`next-update-${customerId}`, newUpdateDate.toISOString());
  };
  
  // Manually trigger an update
  const triggerManualUpdate = async () => {
    if (!customerId) return;
    
    setIsLoading(true);
    try {
      // Call the import listings function
      await hospitable.importListings(customerId);
      
      // Update scheduled date
      scheduleNextUpdate();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hospitable/customers', customerId, 'listings'] });
      
      toast({
        title: "Data Updated Successfully",
        description: "Your property data has been refreshed from Hospitable API.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update property data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Data Refresh Schedule
        </CardTitle>
        <CardDescription>
          Your property data is automatically refreshed on a weekly basis
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nextUpdateDate && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Next scheduled refresh: {format(nextUpdateDate, 'MMMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Time: {format(nextUpdateDate, 'h:mm a')}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={triggerManualUpdate} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Data Now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataRefreshScheduler;