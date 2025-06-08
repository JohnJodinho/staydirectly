import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function HospitableApiSetupInfo() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Hospitable API Integration</CardTitle>
        <CardDescription>
          Connect to your Hospitable account to display your properties
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>
            Unable to connect to the Hospitable API. Please follow the setup instructions below.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">How to set up Hospitable API access:</h3>
            <ol className="list-decimal ml-5 mt-2 space-y-2">
              <li>Log in to your <a href="https://www.hospitable.com/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Hospitable account</a></li>
              <li>Navigate to <strong>Settings &gt; API & Integrations</strong></li>
              <li>Generate a new platform token with at least "read" permissions</li>
              <li>Copy the generated token and add it to your environment variables</li>
            </ol>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2">Environment Variable Setup:</h4>
            <div className="font-mono text-sm bg-gray-800 text-gray-100 p-3 rounded">
              HOSPITABLE_PLATFORM_TOKEN=your_token_here
            </div>
            <p className="text-sm mt-2 text-muted-foreground">
              This token will be used to securely access your Hospitable account data.
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Need help?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Refer to the Hospitable API documentation for detailed setup instructions and troubleshooting.
            </p>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href="https://developer.hospitable.com" target="_blank" rel="noopener noreferrer">
                Hospitable API Docs
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}