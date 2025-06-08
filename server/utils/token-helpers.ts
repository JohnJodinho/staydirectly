// token-helpers.ts
import { Request } from 'express';
import axios from 'axios';

// Helper to fetch the Hospitable token from session or request
export async function getOrRefreshHospitableToken(req: Request): Promise<string | null> {
  try {
    // Check if we have an access token in the session
    if (req.session?.hospitableToken?.access_token && req.session?.hospitableToken?.expires_at) {
      const now = new Date().getTime();
      const expiresAt = new Date(req.session.hospitableToken.expires_at).getTime();
      
      // If token is not expired, return it
      if (now < expiresAt) {
        return req.session.hospitableToken.access_token;
      }
      
      // If token is expired but we have a refresh token, refresh it
      if (req.session.hospitableToken.refresh_token) {
        const refreshedToken = await refreshHospitableToken(req.session.hospitableToken.refresh_token);
        
        if (refreshedToken) {
          // Store refreshed token in session
          req.session.hospitableToken = {
            ...refreshedToken,
            expires_at: new Date(Date.now() + refreshedToken.expires_in * 1000).toISOString()
          };
          
          return refreshedToken.access_token;
        }
      }
    }
    
    // If we have a custom token in the request header, use that
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // No valid token found
    return null;
  } catch (error) {
    console.error('Error getting or refreshing Hospitable token:', error);
    return null;
  }
}

// Helper to refresh an expired token
async function refreshHospitableToken(refreshToken: string) {
  try {
    const clientId = process.env.NEXT_PUBLIC_HOSPITABLE_CLIENT_ID;
    const clientSecret = process.env.HOSPITABLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Missing required environment variables for OAuth flow');
    }
    
    const response = await axios.post('https://connect.hospitable.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
    
    return response.data;
  } catch (error) {
    console.error('Error refreshing Hospitable token:', error);
    return null;
  }
}