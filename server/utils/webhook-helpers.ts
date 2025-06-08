// webhook-helpers.ts - Utilities for webhook signature verification
// Based on Hospitable webhook documentation: https://developer.hospitable.com/docs/connect-api-docs/tplzdxad3aa2w-payload-fields

import crypto from 'crypto';

/**
 * Verify the signature of a webhook request
 * 
 * @param payload The webhook payload (raw request body)
 * @param signature The signature from the headers (x-hospitable-signature)
 * @param secret The webhook secret from environment variables
 * @returns Boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  payload: string | object,
  signature: string | string[] | undefined,
  secret: string
): boolean {
  try {
    if (!signature || !secret) {
      return false;
    }

    // Convert payload to string if it's not already
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // Create HMAC using the secret
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    const calculatedSignature = hmac.digest('hex');
    
    // Get the signature from headers (might be array or string)
    const receivedSignature = Array.isArray(signature) ? signature[0] : signature;
    
    // Compare signatures
    // Note: Hospitable may use different signature formats, so we check both
    // raw hex and prefixed formats to be safe
    return (
      receivedSignature === calculatedSignature ||
      receivedSignature === `sha256=${calculatedSignature}`
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Process a webhook event based on type
 * 
 * @param event The event type from the webhook payload
 * @param data The data from the webhook payload
 */
export function processWebhookEvent(event: string, data: any): void {
  // Log event with timestamp
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Processing webhook event: ${event}`);
  
  try {
    switch (event) {
      // Property events
      case 'property.created':
        handlePropertyCreated(data);
        break;
      case 'property.updated':
        handlePropertyUpdated(data);
        break;
      case 'property.deleted':
        handlePropertyDeleted(data);
        break;
      
      // Booking events
      case 'booking.created':
        handleBookingCreated(data);
        break;
      case 'booking.updated':
        handleBookingUpdated(data);
        break;
      case 'booking.deleted':
        handleBookingDeleted(data);
        break;
      
      // Customer events
      case 'customer.connected':
        handleCustomerConnected(data);
        break;
      case 'customer.disconnected':
        handleCustomerDisconnected(data);
        break;
      
      // Auth events
      case 'auth.revoked':
        handleAuthRevoked(data);
        break;
      
      // Default handler for unrecognized events
      default:
        console.log(`[${timestamp}] Unhandled webhook event type: ${event}`);
        console.log('Event data:', JSON.stringify(data).substring(0, 500) + '...');
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event}:`, error);
  }
}

// Property event handlers
function handlePropertyCreated(data: any): void {
  // According to Hospitable's webhook documentation, property data comes in a specific format
  console.log(`Property ${data.id} created. Name: ${data.listing?.public_name || data.name || 'Unknown'}`);
  
  // Log property details based on Hospitable API structure
  if (data.listing) {
    console.log(`Property details:
      Public name: ${data.listing.public_name || 'N/A'}
      Private name: ${data.listing.private_name || 'N/A'}
      Platform ID: ${data.platform_id || 'N/A'}
      Capacity: ${data.listing.capacity ? JSON.stringify(data.listing.capacity) : 'N/A'}
      Status: ${data.listing.status || 'N/A'}
    `);
  }
  
  // TODO: Add sync to database logic here
  // Example: syncPropertyToDatabase(data);
}

function handlePropertyUpdated(data: any): void {
  // According to Hospitable's webhook documentation, property data comes in a specific format
  console.log(`Property ${data.id} updated. Name: ${data.listing?.public_name || data.name || 'Unknown'}`);
  
  // Log changes
  if (data.changes && Object.keys(data.changes).length > 0) {
    console.log('Changed fields:', Object.keys(data.changes).join(', '));
  }
  
  // TODO: Update property in database
  // Example: updatePropertyInDatabase(data);
  
  // TODO: Clear any cached data for this property
  // Example: clearPropertyCache(data.id);
}

function handlePropertyDeleted(data: any): void {
  console.log(`Property ${data.id} deleted.`);
  
  // TODO: Mark property as inactive in database or remove it
  // Example: markPropertyAsInactive(data.id);
  
  // TODO: Clear any cached data for this property
  // Example: clearPropertyCache(data.id);
}

// Booking event handlers
function handleBookingCreated(data: any): void {
  console.log(`New booking ${data.id} created for property ${data.property_id || 'Unknown'}`);
  console.log(`Booking details: Check-in: ${data.check_in || 'Unknown'}, Check-out: ${data.check_out || 'Unknown'}`);
  
  // TODO: Add booking to database
  // Example: addBookingToDatabase(data);
}

function handleBookingUpdated(data: any): void {
  console.log(`Booking ${data.id} updated. Status: ${data.status || 'Unknown'}`);
  
  // TODO: Update booking in database
  // Example: updateBookingInDatabase(data);
}

function handleBookingDeleted(data: any): void {
  console.log(`Booking ${data.id} deleted.`);
  
  // TODO: Remove booking from database or mark as cancelled
  // Example: markBookingAsCancelled(data.id);
}

// Customer event handlers
function handleCustomerConnected(data: any): void {
  console.log(`Customer ${data.id} connected their account.`);
  
  // TODO: Update customer status in database
  // Example: updateCustomerConnectionStatus(data.id, true);
}

function handleCustomerDisconnected(data: any): void {
  console.log(`Customer ${data.id} disconnected their account.`);
  
  // TODO: Update customer status in database
  // Example: updateCustomerConnectionStatus(data.id, false);
  
  // TODO: Mark associated properties as inactive or disconnected
  // Example: markPropertiesAsDisconnected(data.id);
}

// Auth event handlers
function handleAuthRevoked(data: any): void {
  console.log(`Authorization revoked for customer ${data.customer_id || 'Unknown'}`);
  
  // TODO: Update tokens and connection status in database
  // Example: revokeCustomerTokens(data.customer_id);
}