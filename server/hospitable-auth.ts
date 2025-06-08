// hospitable-auth.ts - Authentication utilities for Hospitable API

import type { Request, Response, Router } from 'express';
import axios from 'axios';
import { verifyWebhookSignature, processWebhookEvent } from './utils/webhook-helpers';

/**
 * Register Hospitable authentication routes
 */
export function registerHospitableAuthRoutes(router: Router) {
  // Token exchange route
  router.post('/auth/hospitable/token', async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      const clientId = process.env.NEXT_PUBLIC_HOSPITABLE_CLIENT_ID;
      const clientSecret = process.env.HOSPITABLE_CLIENT_SECRET;
      const redirectUri = process.env.NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(500).json({ 
          error: 'Missing required environment variables for OAuth flow',
          details: 'Please set NEXT_PUBLIC_HOSPITABLE_CLIENT_ID, HOSPITABLE_CLIENT_SECRET, and NEXT_PUBLIC_HOSPITABLE_REDIRECT_URI'
        });
      }

      // According to documentation: https://developer.hospitable.com/docs/connect-api-docs/8e768e6831f6c-requesting-connect-access
      const response = await axios.post('https://connect.hospitable.com/oauth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      });

      return res.json(response.data);
    } catch (error: any) {
      console.error('Token exchange error:', error);
      
      // Get the response error data if available
      const errorResponse = error.response?.data || {};
      
      return res.status(error.response?.status || 500).json({ 
        error: 'Token exchange failed', 
        details: errorResponse
      });
    }
  });

  // Token refresh route
  router.post('/auth/hospitable/refresh', async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const clientId = process.env.NEXT_PUBLIC_HOSPITABLE_CLIENT_ID;
      const clientSecret = process.env.HOSPITABLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(500).json({ 
          error: 'Missing required environment variables for OAuth flow',
          details: 'Please set NEXT_PUBLIC_HOSPITABLE_CLIENT_ID and HOSPITABLE_CLIENT_SECRET'
        });
      }

      const response = await axios.post('https://connect.hospitable.com/oauth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      });

      return res.json(response.data);
    } catch (error: any) {
      console.error('Token refresh error:', error);
      
      // Get the response error data if available
      const errorResponse = error.response?.data || {};
      
      return res.status(error.response?.status || 500).json({ 
        error: 'Token refresh failed', 
        details: errorResponse
      });
    }
  });

  // User info route
  router.get('/auth/hospitable/user', async (req: Request, res: Response) => {
    try {
      // Check for access token in query params (for client-side usage)
      const accessToken = req.query.access_token as string;
      
      // If no access token in query params, check authorization header
      const authHeader = accessToken 
        ? `Bearer ${accessToken}`
        : req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'Access token or Authorization header is required' });
      }

      const response = await axios.get('https://connect.hospitable.com/api/v1/user', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'Connect-Version': '2024-01'
        }
      });

      return res.json(response.data);
    } catch (error: any) {
      console.error('User info error:', error);
      
      // Get the response error data if available
      const errorResponse = error.response?.data || {};
      
      return res.status(error.response?.status || 500).json({ 
        error: 'Failed to fetch user info', 
        details: errorResponse
      });
    }
  });

  // Hospitable webhook endpoint
  router.post('/webhook/hospitable', async (req: Request, res: Response) => {
    try {
      console.log('Received webhook from Hospitable');
      
      // Log headers for debugging
      const relevantHeaders = {
        'x-hospitable-signature': req.headers['x-hospitable-signature'] || 'missing',
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'connect-version': req.headers['connect-version']
      };
      console.log('Webhook headers:', relevantHeaders);
      
      const signature = req.headers['x-hospitable-signature'];
      
      if (!signature) {
        console.warn('Missing Hospitable signature header');
        return res.status(401).json({ error: 'Missing signature header' });
      }
      
      // Verify webhook signature
      const webhookSecret = process.env.HOSPITABLE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error('HOSPITABLE_WEBHOOK_SECRET environment variable is not set');
        return res.status(500).json({ error: 'Webhook configuration error' });
      }
      
      // Verify signature using our helper
      const isValid = verifyWebhookSignature(req.body, signature, webhookSecret);
      
      if (!isValid) {
        console.warn('Webhook signature verification failed');
        
        // Check if we're in production mode
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (isProduction) {
          // In production, reject unverified webhooks
          return res.status(401).json({
            error: 'Invalid signature',
            details: 'The webhook signature could not be verified'
          });
        } else {
          // In development, continue processing but log the warning
          console.log('Received potentially unverified webhook (allowed in development)');
        }
      } else {
        console.log('Webhook signature verified successfully');
      }
      
      // Extract event and data from webhook body
      const { event, data } = req.body;
      
      if (!event) {
        console.warn('Missing event type in webhook payload');
        return res.status(400).json({ error: 'Missing event type' });
      }
      
      // Log webhook payload with timestamp
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Webhook event: ${event}`);
      
      // Only log payload in development to avoid leaking sensitive data in production
      if (process.env.NODE_ENV !== 'production') {
        console.log('Full webhook payload:', JSON.stringify(req.body, null, 2));
      } else {
        console.log('Payload sample:', JSON.stringify(req.body).substring(0, 200) + '...');
      }
      
      // Process event with our utility function
      processWebhookEvent(event, data);
      
      // Return success response
      return res.json({ 
        received: true,
        timestamp: timestamp,
        event: event,
        message: 'Webhook processed successfully'
      });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ 
        error: 'Webhook processing failed',
        message: error.message
      });
    }
  });

  // Authentication callback handling
  router.get('/auth/callback', (req: Request, res: Response) => {
    const code = req.query.code;
    const error = req.query.error;
    
    if (error) {
      return res.status(400).send(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>Error: ${error}</p>
            <script>
              window.opener && window.opener.postMessage({ error: "${error}" }, "*");
            </script>
          </body>
        </html>
      `);
    }
    
    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>Missing Code</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>No authorization code received</p>
            <script>
              window.opener && window.opener.postMessage({ error: "No authorization code received" }, "*");
            </script>
          </body>
        </html>
      `);
    }
    
    // Return success page with code
    return res.send(`
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <h1>Authentication Successful</h1>
          <p>You can close this window now.</p>
          <script>
            window.opener && window.opener.postMessage({ code: "${code}" }, "*");
            window.close();
          </script>
        </body>
      </html>
    `);
  });
}