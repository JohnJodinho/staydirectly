import React, { useState, useEffect } from 'react';
import HospitablePropertiesList from '@/components/HospitablePropertiesList';
import HospitableApiSetupInfo from '@/components/HospitableApiSetupInfo';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useProperties } from '@/lib/hospitable';

export default function ApiPropertiesPage() {
  const { error } = useProperties();
  const [showSetupInfo, setShowSetupInfo] = useState(false);
  
  // Check if we have an API error and show the setup info
  useEffect(() => {
    if (error) {
      setShowSetupInfo(true);
    } else {
      setShowSetupInfo(false);
    }
  }, [error]);

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/">← Back to Home</Link>
        </Button>
        <h1 className="text-3xl font-bold">Hospitable API Properties</h1>
        <p className="text-muted-foreground mt-2">
          Properties fetched directly from the Hospitable API integration.
        </p>
      </div>

      {showSetupInfo && <HospitableApiSetupInfo />}
      <HospitablePropertiesList />
    </div>
  );
}