import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Router } from 'express';
import { storage } from "./storage-factory";
import { 
  insertCitySchema, 
  insertPropertySchema, 
  insertReviewSchema, 
  insertFavoriteSchema,
  properties
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { setupSitemapRoutes } from "./sitemap";
import { registerHospitableAuthRoutes } from "./hospitable-auth";
import { createServerApiClient } from "./hospitable-client";
import hospitable_controller from "./hospitable-flow-controller";
import dotenv from "dotenv";
dotenv.config();

// Helper function to extract customerId and listingId from platformId
function extractPropertyIds(platformId: string): { customerId: string | null; listingId: string | null } {
  if (!platformId) {
    return { customerId: null, listingId: null };
  }
  
  // Handle different format possibilities:
  // 1. Direct ID with no customer prefix (legacy format)
  // 2. CustomerID/ListingID or CustomerID:ListingID format (new formats)
  let parts: string[];
  
  if (platformId.includes('/')) {
    parts = platformId.split('/');
  } else if (platformId.includes(':')) {
    parts = platformId.split(':');
  } else {
    // Single ID with no delimiter
    return { customerId: null, listingId: platformId };
  }
  
  if (parts.length === 2) {
    // Format with customerId and listingId
    return { customerId: parts[0], listingId: parts[1] };
  }
  
  // Invalid format or single value, return as listingId
  return { customerId: null, listingId: platformId };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // SEO Routes
  const seoRouter = Router();
  
  // Robots.txt
  seoRouter.get('/robots.txt', (req, res) => {
    const robotsTxt = `
# www.robotstxt.org/

User-agent: *
Allow: /

# Sitemaps
Sitemap: https://staydirectly.com/sitemap.xml
`;
    res.type('text/plain');
    res.send(robotsTxt);
  });
  
  // Setup sitemap routes
  setupSitemapRoutes(seoRouter);
  
  // Auth routes for Hospitable
  const authRouter = Router();
  registerHospitableAuthRoutes(authRouter);
  
  // Hospitable flow routes
  // app.post('/api/hospitable/connect', hospitable_controller.connectHospitable);
  app.post('/api/hospitable/import-listings', hospitable_controller.importCustomerListings);
  app.post('/api/hospitable/fetch-property-images', hospitable_controller.fetchPropertyImages);
  app.post('/api/hospitable/publish-properties', hospitable_controller.markPropertiesForPublishing);
  
  // API route for fetching property images
  app.get('/api/hospitable/property-images/:customerId/:listingId', async (req: Request, res: Response) => {
    try {
      const { customerId, listingId } = req.params;
      const position = parseInt(req.query.position as string || '0');
      
      if (!customerId || !listingId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
      
      // Forward the request to our controller
      await hospitable_controller.fetchPropertyImages({
        body: { customerId, listingId, position },
      } as Request, res);
    } catch (error) {
      console.error('Error handling property images request:', error);
      res.status(500).json({ message: 'Error fetching property images' });
    }
  });
  
  // API client library for frontend
  app.get('/api/hospitable/api-client', (req: Request, res: Response) => {
    // This route provides client-side configuration for the Hospitable API
    res.json({
      baseUrl: 'https://connect.hospitable.com/api/v1',
      apiVersion: '2022-11-01',
      clientId: process.env.NEXT_PUBLIC_HOSPITABLE_CLIENT_ID
    });
  });
  
  // Apply SEO and auth routes
  app.use(seoRouter);
  app.use('/api', authRouter);
  // Properties API
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const isPublished = req.query.isPublished as string;
      
      // If isPublished parameter is provided, filter by published status
      if (isPublished === 'true') {
        const properties = await storage.searchProperties('isPublished:true', { limit, offset });
        return res.json(properties);
      } else if (isPublished === 'false') {
        const properties = await storage.searchProperties('isPublished:false', { limit, offset });
        return res.json(properties);
      } else if (isPublished === 'all') {
        // Return all properties regardless of published status
        const properties = await storage.getProperties(limit, offset);
        return res.json(properties);
      }
      
      // Default behavior - get all properties
      const properties = await storage.getProperties(limit, offset);
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ message: "Failed to fetch properties", error: error instanceof Error ? error.message : String(error) });
    }
  });



  app.get("/api/properties/featured", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const properties = await storage.getFeaturedProperties(limit);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  app.get("/api/properties/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || "";
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
      const properties = await storage.searchProperties(query, filters);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req: Request, res: Response) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  
  app.patch("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const propertyData = req.body;
      
      // Ensure the property exists
      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // If unpublishing, remove publishedAt field
      if (propertyData.unpublish === true) {
        propertyData.publishedAt = null;
        delete propertyData.unpublish;
      }
      if (propertyData.bookingWidgetHtml) {
        propertyData.bookingWidgetUrl = propertyData.bookingWidgetHtml;
        delete propertyData.bookingWidgetHtml;
      }
      if (propertyData.reviewsWidgetHtml) {
        propertyData.reviewWidgetCode = propertyData.reviewsWidgetHtml;
        delete propertyData.reviewsWidgetHtml;
      }

      
      const updatedProperty = await storage.updateProperty(id, propertyData);
      res.json(updatedProperty);
    } catch (error) {
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  
  app.delete("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Ensure the property exists
      const existingProperty = await storage.getProperty(id);
      if (!existingProperty) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Soft delete the property
      const success = await storage.deleteProperty(id);
      
      if (success) {
        res.status(200).json({ message: "Property deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete property" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Cities API
  app.get("/api/cities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const cities = await storage.getCities(limit);
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.get("/api/cities/featured", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const cities = await storage.getFeaturedCities(limit);
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured cities" });
    }
  });

  app.get("/api/cities/:name", async (req: Request, res: Response) => {
    try {
      const city = await storage.getCityByName(req.params.name);
      
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json(city);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch city" });
    }
  });

  app.post("/api/cities", async (req: Request, res: Response) => {
    try {
      const cityData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(cityData);
      res.status(201).json(city);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid city data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create city" });
    }
  });

  app.get("/api/cities/:name/properties", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const properties = await storage.getPropertiesByCity(req.params.name, limit, offset);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch city properties" });
    }
  });

  // Neighborhoods API
  app.get("/api/cities/:id/neighborhoods", async (req: Request, res: Response) => {
    try {
      const cityId = parseInt(req.params.id);
      const neighborhoods = await storage.getNeighborhoods(cityId);
      res.json(neighborhoods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch neighborhoods" });
    }
  });

  // Reviews API
  app.get("/api/properties/:id/reviews", async (req: Request, res: Response) => {
    try {
      const propertyId = parseInt(req.params.id);
      const reviews = await storage.getReviews(propertyId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Favorites API (these would normally require authentication)
  app.get("/api/users/:userId/favorites", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      const favoriteData = insertFavoriteSchema.parse(req.body);
      const favorite = await storage.addFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites", async (req: Request, res: Response) => {
    try {
      const { userId, propertyId } = req.body;
      if (!userId || !propertyId) {
        return res.status(400).json({ message: "Missing userId or propertyId" });
      }
      
      const success = await storage.removeFavorite(parseInt(userId), parseInt(propertyId));
      
      if (!success) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/check", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const propertyId = parseInt(req.query.propertyId as string);
      
      if (isNaN(userId) || isNaN(propertyId)) {
        return res.status(400).json({ message: "Invalid userId or propertyId" });
      }
      
      const isFavorite = await storage.isFavorite(userId, propertyId);
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Hospitable API proxy routes
  const hospitable = {
    properties: '/api/hospitable/properties',
    property: '/api/hospitable/properties/:id',
    customers: '/api/hospitable/customers',
    customer: '/api/hospitable/customers/:id',
    customerListings: '/api/hospitable/customers/:id/listings',
    bookings: '/api/hospitable/bookings',
    booking: '/api/hospitable/bookings/:id',
    authCodes: '/api/hospitable/auth-codes',
    connect: '/api/hospitable/connect',
  };

  // Middleware to ensure Hospitable API token is set
  const requireHospitableToken = (req: Request, res: Response, next: Function) => {
    try {
      // This will throw if token is not available
      createServerApiClient();
      next();
    } catch (error: any) {
      res.status(500).json({ 
        message: "Hospitable API connection error", 
        error: error.message || "Missing API token"
      });
    }
  };

  // Apply middleware to all Hospitable routes
  app.use([
    hospitable.properties, 
    hospitable.property,
    hospitable.customers,
    hospitable.customer,
    hospitable.customerListings,
    hospitable.bookings,
    hospitable.booking,
    hospitable.authCodes,
    hospitable.connect
  ], requireHospitableToken);

  // Hospitable Properties
  app.get(hospitable.properties, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      
      console.log(`Attempting to fetch properties from Hospitable API...`);
      const properties = await api.getProperties();
      console.log(`Successfully fetched ${properties?.length || 0} properties from Hospitable API`);
      
      res.json(properties);
    } catch (error: any) {
      console.error('Hospitable API Error:', error);
      res.status(500).json({ 
        message: "Failed to fetch properties from Hospitable", 
        error: error.message,
        details: error.code ? { code: error.code, status: error.status } : undefined
      });
    }
  });
  
  // Properties search with filtering
  // Route to https://connect.hospitable.com/api/v1/properties does not exist
  app.get(`${hospitable.properties}/search`, async (req: Request, res: Response) => {
    try {
      const { location, checkIn, checkOut, guests } = req.query;
      
      // Build the query parameters
      const queryParams = new URLSearchParams();
      if (location) queryParams.append('location', location as string);
      if (checkIn) queryParams.append('check_in', checkIn as string);
      if (checkOut) queryParams.append('check_out', checkOut as string);
      if (guests) queryParams.append('guests', guests as string);
      
      console.log(`Searching properties with params: ${queryParams.toString()}`);
      
      // Fetch properties from Hospitable
      // API endpoint matches https://developer.hospitable.com/docs/connect-api-docs/ef1653c7c2b79-list-properties
      const response = await fetch(
        `https://connect.hospitable.com/api/v1/properties?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.HOSPITABLE_PLATFORM_TOKEN}`,
            'Accept': 'application/json',
            'Connect-Version': '2024-01'
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch properties from Hospitable:', errorData);
        return res.status(response.status).json({ 
          error: 'Failed to fetch properties',
          details: errorData
        });
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error('Error searching properties:', error);
      res.status(500).json({ 
        message: "Failed to search properties from Hospitable", 
        error: error.message 
      });
    }
  });

  app.get(hospitable.property, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      const property = await api.getProperty(req.params.id);
      res.json(property);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch property from Hospitable", error: error.message });
    }
  });
  
  // Property SEO routes
  app.get(`${hospitable.property}/seo`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Fetch property from Hospitable API
      const api = createServerApiClient();
      const property = await api.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      
      // Extract SEO-relevant data from the property object
      // Adjust according to actual Hospitable API response structure
      const seoData = {
        title: property.name,
        description: property.description || '',
        images: property.imageUrl ? [property.imageUrl] : [],
        location: {
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          country: property.country || '',
          postalCode: '',
          latitude: property.latitude || 0,
          longitude: property.longitude || 0
        },
        features: [],
        roomCount: property.bedrooms || 0,
        bathroomCount: property.bathrooms || 0,
        guestCount: property.maxGuests || 0,
        extraData: {} // This would be where custom SEO data is stored
      };
      
      return res.json(seoData);
    } catch (error: any) {
      console.error('Error fetching property SEO data:', error);
      res.status(500).json({ 
        message: "Failed to fetch property SEO data", 
        error: error.message 
      });
    }
  });
  
  // Update property SEO data
  app.put(`${hospitable.property}/seo`, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const seoUpdates = req.body;
      
      // In a real implementation with a database, we would store this data
      // For now, we'll just return success
      // Note: This would typically include updating property data via Hospitable API
      // or storing custom SEO fields in our database
      
      console.log(`Would update SEO data for property ${id}:`, seoUpdates);
      
      return res.json({ 
        success: true, 
        message: "SEO data updated (implementation would store this in database)" 
      });
    } catch (error: any) {
      console.error('Error updating property SEO data:', error);
      res.status(500).json({ 
        message: "Failed to update property SEO data", 
        error: error.message 
      });
    }
  });

  app.post(hospitable.properties, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      const property = await api.createProperty(req.body);
      res.status(201).json(property);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create property in Hospitable", error: error.message });
    }
  });

  // Hospitable Customers
  app.get(hospitable.customers, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      const customers = await api.getCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch customers from Hospitable", error: error.message });
    }
  });

  app.get(hospitable.customer, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      const customer = await api.getCustomer(req.params.id);
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch customer from Hospitable", error: error.message });
    }
  });

  // Hospitable Bookings
  app.get(hospitable.bookings, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      const filters = {
        propertyId: req.query.propertyId as string,
        customerId: req.query.customerId as string
      };
      const bookings = await api.getBookings(filters);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch bookings from Hospitable", error: error.message });
    }
  });

  app.post(hospitable.bookings, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      const booking = await api.createBooking(req.body);
      res.status(201).json(booking);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to create booking in Hospitable", error: error.message });
    }
  });

  app.patch(`${hospitable.booking}/status`, async (req: Request, res: Response) => {
    try {
      const api = createServerApiClient();
      const { status } = req.body;
      const booking = await api.updateBookingStatus(req.params.id, status);
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update booking status in Hospitable", error: error.message });
    }
  });

  // Customer Listings (Airbnb properties)
  app.get(hospitable.customerListings, async (req: Request, res: Response) => {
    try {
      const customerId = req.params.id;
      console.log(`[API Route] Fetching listings for customer: ${customerId}`);
      
      // API endpoint matches https://developer.hospitable.com/docs/connect-api-docs/a8adea59d36e3-list-listings
      const url = `https://connect.hospitable.com/api/v1/customers/${customerId}/listings`;
      console.log(`[API Route] Request URL: ${url}`);
      
      const listingsResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.HOSPITABLE_PLATFORM_TOKEN}`,
          'Accept': 'application/json',
          'Connect-Version': '2024-01'
        }
      });

      const listingsData = await listingsResponse.json();
      console.log('[API Route] Listings data received');
      console.log('[API Route] Listings response status:', listingsResponse.status);
      
      if (!listingsResponse.ok) {
        console.error('[API Route] Error fetching listings:', listingsData);
        return res.status(listingsResponse.status).json({ 
          error: listingsData.error || 'Failed to fetch listings',
          details: listingsData.details || {} 
        });
      }

      // Log the structure of the data (but not all the potentially large response)
      console.log('[API Route] Listings data structure:', 
        JSON.stringify({
          dataType: typeof listingsData,
          isArray: Array.isArray(listingsData),
          count: Array.isArray(listingsData) ? listingsData.length : 'N/A',
          keys: typeof listingsData === 'object' ? Object.keys(listingsData) : 'N/A'
        }, null, 2)
      );
      
      // If the response has a data property, return that to match Hospitable API structure
      const responseData = listingsData.data || listingsData;
      
      return res.json(responseData);
    } catch (error: any) {
      console.error('[API Route] Error fetching listings:', error);
      res.status(500).json({ 
        message: "Failed to fetch customer listings from Hospitable", 
        error: error.message 
      });
    }
  });

  // Auth code generation for customer authorization
  app.post(hospitable.authCodes, async (req: Request, res: Response) => {
    try {
      console.log(`${hospitable.authCodes} API route called (wrong one)`)
      console.log('[API Route] Generating auth code...');
      const { customerId, redirectUrl } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      const authResponse = await fetch('https://connect.hospitable.com/api/v1/auth-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HOSPITABLE_PLATFORM_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Connect-Version': '2024-01'
        },
        body: JSON.stringify({
          customer_id: customerId,
          redirect_url: redirectUrl || `${req.protocol}://${req.get('host')}/auth/callback`
        })
      });

      const authData = await authResponse.json();
      console.log('[API Route] Auth code response received');

      if (!authResponse.ok) {
        console.error('[API Route] Error generating auth code:', authData);
        return res.status(authResponse.status).json({ 
          error: authData.error || 'Failed to generate auth code',
          details: authData.details || {}
        });
      }

      res.json({
        authUrl: authData.data.return_url,
        expiresAt: authData.data.expires_at
      });
    } catch (error: any) {
      console.error('[API Route] Error generating auth code:', error);
      res.status(500).json({ 
        message: "Failed to generate auth code", 
        error: error.message 
      });
    }
  });

  // Connect API route for customer creation and auth code generation
  // Import Hospitable listings into the database
  app.post('/api/hospitable/import-listings', async (req: Request, res: Response) => {
    try {
      console.log('/api/hospitable/import-listings API route called (wrong one)');
      // Extract customer ID from request body
      const { customerId } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required for importing listings' });
      }
      
      // Use the platform token for this operation
      const token = process.env.HOSPITABLE_PLATFORM_TOKEN;
      
      if (!token) {
        return res.status(401).json({ message: 'Hospitable platform token not found in environment' });
      }

      const client = new HospitableAPI({
        apiToken: token,
        baseUrl: 'https://connect.hospitable.com'
      });

      // Fetch customer listings from Hospitable API
      console.log(`[API Route] Fetching listings for customer: ${customerId}`);
      console.log(`[API Route] Request URL: https://connect.hospitable.com/api/v1/customers/${customerId}/listings`);
      const response = await client.getCustomerListings(customerId);
      console.log(`[API Route] Listings response status: ${response ? 200 : 404}`);
      
      // If response is an object with a data property (paged response), use that, otherwise use the full response
      const hospProperties = response?.data || response;
      
      console.log(`[API Route] Listings data structure: ${
        JSON.stringify({
          dataType: typeof hospProperties,
          isArray: Array.isArray(hospProperties),
          count: Array.isArray(hospProperties) ? hospProperties.length : "N/A",
          keys: typeof hospProperties === 'object' ? Object.keys(hospProperties) : []
        }, null, 2)
      }`);
      
      if (!hospProperties?.length) {
        return res.status(404).json({ message: 'No properties found in Hospitable account' });
      }
      
      // Import each property into our database
      let importedCount = 0;
      let importedProperties = [];
      
      for (const prop of hospProperties) {
        try {
          // Check if property already exists by ID
          let existingProperty = await storage.getProperty(Number(prop.id));
          
          const propertyData = {
            name: prop.private_name || prop.public_name || 'Unnamed Property',
            title: prop.public_name || prop.private_name || 'Unnamed Property', // Use public_name for display title
            description: prop.description || 'Beautiful property',
            price: Number(prop.base_price) || 99,
            imageUrl: (prop.picture || prop.photos?.[0]?.url || '').replace('/im\\', '/'),
            additionalImages: prop.photos?.slice(1).map(p => p.url.replace('/im\\', '/')) || [],
            address: prop.address || '',
            city: prop.city || 'Unknown',
            state: prop.state || '',
            country: prop.country || 'Unknown',
            location: `${prop.city || ''}, ${prop.state || ''}, ${prop.country || ''}`.replace(/, ,/g, ',').replace(/^, /, '').replace(/, $/, ''),
            latitude: prop.latitude ? Number(prop.latitude) : null,
            longitude: prop.longitude ? Number(prop.longitude) : null,
            bedrooms: prop.bedrooms ? Number(prop.bedrooms) : 1,
            bathrooms: prop.bathrooms ? Number(prop.bathrooms) : 1,
            maxGuests: prop.max_guests ? Number(prop.max_guests) : 2,
            // Store the detailed capacity object from the Hospitable API
            capacity: prop.capacity ? {
              max: prop.capacity.max ? Number(prop.capacity.max) : (prop.max_guests ? Number(prop.max_guests) : 2),
              beds: prop.capacity.beds ? Number(prop.capacity.beds) : (prop.beds ? Number(prop.beds) : 1),
              bedrooms: prop.capacity.bedrooms ? Number(prop.capacity.bedrooms) : (prop.bedrooms ? Number(prop.bedrooms) : 1),
              bathrooms: prop.capacity.bathrooms ? Number(prop.capacity.bathrooms) : (prop.bathrooms ? Number(prop.bathrooms) : 1)
            } : null,
            amenities: prop.amenities || [],
            hostId: 1, // Default host ID
            hostName: 'Property Owner',
            rating: 4.5,
            reviewCount: 0,
            type: prop.property_type || 'Apartment',
            isFeatured: true,
            isActive: true,
            isVerified: true,
            metaTitle: prop.public_name || prop.private_name,
            metaDescription: prop.description?.substring(0, 160) || 'Book this amazing property directly with the owner',
            keywords: ['vacation rental', 'direct booking', prop.city || '', prop.property_type || ''],
            rules: prop.house_rules || '',
            checkInTime: '15:00',
            checkOutTime: '11:00',
            minNights: prop.min_nights ? Number(prop.min_nights) : 1,
            maxNights: prop.max_nights ? Number(prop.max_nights) : 30,
            platformId: prop.id,
            platformType: 'hospitable',
            externalId: prop.id
          };
          
          let property;
          if (existingProperty) {
            // Update existing property
            property = await storage.updateProperty(existingProperty.id, propertyData);
            console.log(`Updated existing property ${existingProperty.id}`);
          } else {
            // Create new property
            property = await storage.createProperty(propertyData);
            console.log(`Created new property ${property.id}`);
          }
          
          importedProperties.push(property);
          importedCount++;
        } catch (error) {
          console.error('Error importing property:', error);
          // Continue with other properties even if one fails
        }
      }
      
      console.log(`Successfully imported ${importedCount} properties`);
      res.status(200).json(importedProperties);
    } catch (error) {
      console.error('Error importing Hospitable listings:', error);
      res.status(500).json({ 
        message: 'Error importing properties from Hospitable',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Mark selected Hospitable listings for publishing as property pages
  // Get property images from Hospitable API
  // Simple in-memory cache to prevent too many API calls to Hospitable
  const imageCache: Record<string, { data: any, timestamp: number }> = {};
  // API rate limiting data
  const apiRateLimit: Record<string, { count: number, timestamp: number }> = {};
  // Mock sample image data for when we're rate limited and have no cache
  const fallbackImages = [
    { 
      url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM3MTA0ODcyMzEzMzYyMjM5NA==/original/e68a4732-3aa3-4d57-8f77-aba7d0e70d90.jpeg',
      thumbnail_url: 'https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTM3MTA0ODcyMzEzMzYyMjM5NA==/original/e68a4732-3aa3-4d57-8f77-aba7d0e70d90.jpeg',
      position: 0
    }
  ];
  
  // Function to get a position-specific fallback image when rate limited
  function getPositionDependentImage(position: number) {
    // Ensure we return a valid image even at position 0
    return {
      url: fallbackImages[0].url,
      thumbnail_url: fallbackImages[0].thumbnail_url,
      position,
      fromFallback: true
    };
  }
  
  // Helper function to download and store property images
  async function downloadAndStorePropertyImages(customerId: string, listingId: string) {
    try {
      // Ensure we have a well-formed listing ID (Hospitable expects a UUID format)
      // If listingId looks like a simple ID without hyphens and is the right length, format it
      if (listingId.length === 32 && !listingId.includes('-')) {
        // Format as proper UUID
        listingId = `${listingId.slice(0, 8)}-${listingId.slice(8, 12)}-${listingId.slice(12, 16)}-${listingId.slice(16, 20)}-${listingId.slice(20)}`;
        console.log(`[API Route] Reformatted listingId to UUID format: ${listingId}`);
      }
      
      // First check if we have this image set cached
      const cacheKey = `${customerId}:${listingId}`;
      
      // Extend the cache lifetime to 24 hours since images rarely change
      if (imageCache[cacheKey] && (Date.now() - imageCache[cacheKey].timestamp < 24 * 60 * 60 * 1000)) {
        console.log(`[API Route] Using cached images for ${customerId}/${listingId}`);
        return imageCache[cacheKey].data.data || [];
      }

      // Robust rate limiting - very conservative to avoid 429 errors
      const now = Date.now();
      const rateLimitWindow = 5000; // 5 seconds between requests for same listing
      
      // Initialize if needed
      if (!global.apiRateLimit) {
        global.apiRateLimit = {};
      }
      
      if (global.apiRateLimit[cacheKey]) {
        const timeElapsed = now - global.apiRateLimit[cacheKey].timestamp;
        if (timeElapsed < rateLimitWindow) {
          // Wait for the required time if we're trying to call too quickly
          const waitTime = rateLimitWindow - timeElapsed;
          console.log(`[API Route] Rate limiting active for ${customerId}/${listingId}, waiting ${waitTime/1000}s`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      // Update rate limit timestamp
      global.apiRateLimit[cacheKey] = { 
        count: (global.apiRateLimit[cacheKey]?.count || 0) + 1, 
        timestamp: Date.now() 
      };
      
      // Use the token from environment variable
      const token = process.env.HOSPITABLE_PLATFORM_TOKEN;
      
      if (!token) {
        console.error('Hospitable platform token not found in environment variables');
        return [];
      }
      
      console.log(`[API Route] Fetching images from Hospitable API for ${customerId}/${listingId}`);
      
      // First try to find the property in the database to avoid API calls
      const platformIdFormats = [
        `${customerId}/${listingId}`,  // Standard format
        `${customerId}:${listingId}`,  // Alternative format
        listingId                      // Legacy format
      ];
      
      for (const platformIdFormat of platformIdFormats) {
        const results = await storage.searchProperties(`platformId:${platformIdFormat}`, {});
        if (results.length > 0 && results[0].imageUrl) {
          const property = results[0];
          console.log(`[API Route] Using database images for property #${property.id}`);
          
          // Convert database images to API format
          const allImages = [
            {
              url: property.imageUrl,
              thumbnail_url: property.imageUrl,
              position: 0,
              fromDatabase: true
            },
            ...(property.additionalImages || []).map((url, idx) => ({
              url,
              thumbnail_url: url,
              position: idx + 1,
              fromDatabase: true
            }))
          ];
          
          // Cache these results as well
          imageCache[cacheKey] = {
            data: { data: allImages },
            timestamp: Date.now()
          };
          
          return allImages;
        }
      }
      
      // Try the dedicated images endpoint first
      const imageUrl = `https://connect.hospitable.com/api/v1/customers/${customerId}/listings/${listingId}/images`;
      console.log(`[API Route] Request URL: ${imageUrl}`);
      
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Connect-Version': '2022-11-01', // API version as per Hospitable docs
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`[API Route] Response status: ${response.status}`);
      
      // Handle various response scenarios
      if (!response.ok) {
        if (response.status === 404) {
          // Try alternate endpoint for listing details
          console.log(`[API Route] Images endpoint returned 404, trying listing details endpoint`);
          const detailsUrl = `https://connect.hospitable.com/api/v1/customers/${customerId}/listings/${listingId}`;
          
          // Add a delay before making another API call
          await new Promise(resolve => setTimeout(resolve, 1000)); 
          
          const detailsResponse = await fetch(detailsUrl, {
            method: 'GET',
            headers: {
              'Connect-Version': '2022-11-01', // API version as per Hospitable docs
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!detailsResponse.ok) {
            const statusCode = detailsResponse.status;
            let errorMessage = `Failed to fetch listing details: ${statusCode}`;
            
            try {
              const errorData = await detailsResponse.json();
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // If we can't parse JSON, just use the status code
            }
            
            console.error(`[API Route] HTTP error when fetching listing details: ${statusCode}`);
            throw new Error(errorMessage);
          }
          
          const data = await detailsResponse.json();
          
          // Extract images from listing details
          let images = [];
          if (data.images && Array.isArray(data.images)) {
            images = data.images;
          } else if (data.photos && Array.isArray(data.photos)) {
            images = data.photos.map((photo: any) => ({
              url: photo.url || '',
              thumbnail_url: photo.thumbnail_url || photo.url || '',
              caption: photo.caption || '',
              position: photo.position || 0
            }));
          } else if (data.picture) {
            // Single image in picture field
            images = [{
              url: data.picture,
              thumbnail_url: data.picture,
              caption: data.public_name || '',
              position: 0
            }];
          }
          
          // Process the images to ensure high quality
          const processedImages = images.map((img: any, index: number) => {
            // Extract base URL from potentially complex muscache.com URLs
            let imageUrl = img.url || '';
            
            // Optimize Airbnb image URLs
            if (imageUrl.includes('muscache.com')) {
              // First, convert /im/ URLs to direct URLs for higher quality
              if (imageUrl.includes('/im/')) {
                imageUrl = imageUrl.replace('https://a0.muscache.com/im/', 'https://a0.muscache.com/');
              }
              
              // Then ensure we're using the large policy for better resolution
              if (imageUrl.includes('aki_policy=')) {
                imageUrl = imageUrl.replace(/aki_policy=[^&]+/, 'aki_policy=large');
              } else {
                // Add large policy if it doesn't exist
                imageUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'aki_policy=large';
              }
            }
            
            return {
              ...img,
              url: imageUrl,
              thumbnail_url: img.thumbnail_url || imageUrl,
              position: index
            };
          });
          
          // Store in cache
          imageCache[cacheKey] = {
            data: { data: processedImages },
            timestamp: Date.now()
          };
          
          console.log(`[API Route] Successfully processed ${processedImages.length} images from listing details`);
          return processedImages;
        }
        
        if (response.status === 429) {
          console.log(`[API Route] Rate limit exceeded for ${customerId}/${listingId}, will retry later`);
          throw new Error(`Rate limit exceeded (429) when fetching images for ${customerId}/${listingId}`);
        }
        
        const statusCode = response.status;
        let errorMessage = `Failed to fetch images: ${statusCode}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse JSON, just use the status code
        }
        
        throw new Error(errorMessage);
      }
      
      // Successfully fetched from the images endpoint
      const data = await response.json();
      let resultImages;
      
      // Handle possible response formats
      if (data.data && Array.isArray(data.data)) {
        resultImages = data.data;
      } else if (Array.isArray(data)) {
        resultImages = data;
      } else {
        console.log(`[API Route] Unexpected data format. Keys found:`, Object.keys(data));
        resultImages = [];
      }
      
      // Process the images to ensure high quality
      const processedImages = resultImages.map((img: any, index: number) => {
        // Extract base URL
        let imageUrl = img.url || '';
        
        // Optimize Airbnb image URLs
        if (imageUrl.includes('muscache.com')) {
          // First, convert /im/ URLs to direct URLs for higher quality
          if (imageUrl.includes('/im/')) {
            imageUrl = imageUrl.replace('https://a0.muscache.com/im/', 'https://a0.muscache.com/');
          }
          
          // Then ensure we're using the large policy for better resolution
          if (imageUrl.includes('aki_policy=')) {
            imageUrl = imageUrl.replace(/aki_policy=[^&]+/, 'aki_policy=large');
          } else {
            // Add large policy if it doesn't exist
            imageUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'aki_policy=large';
          }
        }
        
        return {
          ...img,
          url: imageUrl,
          thumbnail_url: img.thumbnail_url || imageUrl,
          position: img.position || index
        };
      });
      
      // Store in cache with processed images
      imageCache[cacheKey] = {
        data: { data: processedImages },
        timestamp: Date.now()
      };
      
      console.log(`[API Route] Successfully fetched ${processedImages.length} images from images endpoint`);
      return processedImages;
    } catch (error) {
      console.error(`[API Route] Error downloading images for ${customerId}/${listingId}:`, error);
      // Don't return null, return empty array to prevent errors downstream
      return [];
    }
  }
  
  // Store downloaded images for a property
  async function storePropertyImages(platformId: string, images: any[]) {
    try {
      if (!images || images.length === 0) {
        console.log(`[API Route] No images to store for platformId ${platformId}`);
        return false;
      }
      
      // Try multiple search patterns to find the property
      const searchPatterns = [
        `platformId:${platformId}`,
        `external_id:${platformId}`,
        `externalId:${platformId}`
      ];
      
      let property = null;
      
      // Try each search pattern until we find the property
      for (const searchPattern of searchPatterns) {
        const results = await storage.searchProperties(searchPattern, {});
        if (results && results.length > 0) {
          property = results[0];
          console.log(`[API Route] Found property #${property.id} using search pattern: ${searchPattern}`);
          break;
        }
      }
      
      if (!property) {
        console.log(`[API Route] No property found for platformId ${platformId}`);
        return false;
      }
      
      // Process and format image data
      const processedImages = images.map((img: any) => {
        // Ensure we have a URL
        if (!img.url) return null;
        
        let imageUrl = img.url || '';
        
        // Optimize Airbnb image URLs
        if (imageUrl.includes('muscache.com')) {
          // First, convert /im/ URLs to direct URLs for higher quality
          if (imageUrl.includes('/im/')) {
            imageUrl = imageUrl.replace('https://a0.muscache.com/im/', 'https://a0.muscache.com/');
          }
          
          // Then ensure we're using the large policy for better resolution
          if (imageUrl.includes('aki_policy=')) {
            imageUrl = imageUrl.replace(/aki_policy=[^&]+/, 'aki_policy=large');
          } else {
            // Add large policy if it doesn't exist
            imageUrl = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'aki_policy=large';
          }
        }
        
        return imageUrl;
      }).filter(Boolean); // Remove any null entries
      
      if (processedImages.length === 0) {
        console.log(`[API Route] No valid images found for property #${property.id}`);
        return false;
      }
      
      // The first image is the main image, the rest are additional
      const mainImage = processedImages[0];
      const additionalImages = processedImages.slice(1);
      
      console.log(`[API Route] Storing ${processedImages.length} images for property #${property.id}:`);
      console.log(`[API Route] Main image: ${mainImage}`);
      console.log(`[API Route] Additional images: ${additionalImages.length}`);
      
      // Update property with the image URLs
      await storage.updateProperty(property.id, {
        imageUrl: mainImage,
        additionalImages: additionalImages as string[],
        // Use the explicit timestamp field
        updatedAt: new Date() // This updates the last modified timestamp
      });
      
      // Make a separate call to update the imagesStoredAt field
      // This is a workaround for TypeScript issues with the property schema
      await db.update(properties)
        .set({ 
          imagesStoredAt: new Date()
        })
        .where(eq(properties.id, property.id));
      
      console.log(`[API Route] Successfully stored ${additionalImages.length + 1} images for property #${property.id}`);
      return true;
    } catch (error) {
      console.error('[API Route] Error storing property images:', error);
      return false;
    }
  }

  app.get('/api/hospitable/property-images/:customerId/:listingId', async (req: Request, res: Response) => {
    console.log('/api/hospitable/property-images/:customerId/:listingId API route called (wrong one)')
    // Declare position at a higher scope so it's available in the catch block
    let position = 0;
    
    try {
      const { customerId, listingId } = req.params;
      const { pos, refresh } = req.query; // Get position parameter and cache refresh flag
      position = Number(pos) || 0; // Convert to number, default to 0
      const forceRefresh = true; // Always force refresh to get fresh, unique images
      
      // Create a unique identifier for this customer/listing pair for rate limiting
      const rateLimitKey = `${customerId}/${listingId}`;
      
      // Check for rate limiting first - only allow 1 request per 5 seconds per customer/listing
      if (!global.apiRateLimitCache) {
        global.apiRateLimitCache = {};
      }
      
      const currentTime = Date.now();
      const requestWindow = 5000; // 5 seconds in ms (increased from 3s)
      
      if (global.apiRateLimitCache[rateLimitKey]) {
        const timeElapsed = currentTime - global.apiRateLimitCache[rateLimitKey].timestamp;
        
        if (timeElapsed < requestWindow) {
          // We're being rate limited, return 429 with specific message
          console.log(`[API Rate Limit] Too many requests for ${rateLimitKey}`);
          
          // Return a 429 response with metadata
          return res.status(429).json({ 
            message: 'Rate limit exceeded for this listing. Please try again later.',
            rateLimited: true,
            retryAfter: Math.ceil((requestWindow - timeElapsed) / 1000),
            // Include info about which position was requested for better UI handling
            position
          });
        }
      }
      
      // Update the rate limit timestamp for this key
      global.apiRateLimitCache[rateLimitKey] = { timestamp: currentTime };
      
      // First, try to find if we have this property in our database with stored images
      const platformId = listingId;
      const existingProperties = await storage.searchProperties(`external_id:${platformId}`, {});
      const property = existingProperties?.length > 0 ? existingProperties[0] : null;
      
      // If we have a property with stored images, use those instead of hitting the API
      if (
        property && 
        property.imageUrl &&
        !forceRefresh &&
        (property.additionalImages?.length > 0 || position === 0)
      ) {
        console.log(`Using stored images for property with platformId ${platformId}`);
        
        // If position is specified, return just that image
        if (position !== undefined) {
          if (position === 0) {
            // Main image
            return res.json({
              data: [{
                url: property.imageUrl,
                thumbnail_url: property.imageUrl,
                position: 0,
                fromDatabase: true
              }]
            });
          } else if (property.additionalImages && position <= property.additionalImages.length) {
            // Additional image
            const imageUrl = property.additionalImages[position - 1];
            return res.json({
              data: [{
                url: imageUrl,
                thumbnail_url: imageUrl,
                position,
                fromDatabase: true
              }]
            });
          }
          // If position is out of range, continue to API/cache logic
        } else {
          // Return all images
          const allImages = [
            {
              url: property.imageUrl,
              thumbnail_url: property.imageUrl,
              position: 0,
              fromDatabase: true
            },
            ...(property.additionalImages || []).map((url, idx) => ({
              url,
              thumbnail_url: url,
              position: idx + 1,
              fromDatabase: true
            }))
          ];
          
          return res.json({
            data: allImages,
            fromDatabase: true
          });
        }
      }
      
      // Allow shared locks - multiple requests for same customer/listing are counted as one
      // but with distinct position parameters
      const apiLockKey = `${customerId}:${listingId}`;
      
      if (!customerId || !listingId) {
        return res.status(400).json({ message: 'Customer ID and listing ID are required' });
      }
      
      // Create a cache key that includes customer and listing IDs
      const cacheKey = `${customerId}:${listingId}`;
      
      // Check additional rate limits for more frequent API requests in a time window
      // Allow up to 5 requests per minute per customer/listing
      const requestTime = Date.now();
      const timeWindow = 60 * 1000; // 1 minute in ms
      const maxRequestsPerWindow = 5;
      
      // Make sure apiRateLimit is initialized
      if (!global.apiRateLimit) {
        global.apiRateLimit = {};
      }
      
      if (!global.apiRateLimit[cacheKey]) {
        global.apiRateLimit[cacheKey] = { count: 1, timestamp: requestTime };
      } else if (requestTime - global.apiRateLimit[cacheKey].timestamp > timeWindow) {
        // Reset if window has passed
        global.apiRateLimit[cacheKey] = { count: 1, timestamp: requestTime };
      } else {
        // Increment within current window
        global.apiRateLimit[cacheKey].count++;
        
        // Check if over limit
        if (global.apiRateLimit[cacheKey].count > maxRequestsPerWindow) {
          console.warn(`[API Rate Limit] Too many requests for ${customerId}/${listingId}`);
          
          // Instead of failing with 429, use cached data if available
          if (imageCache[cacheKey] && !forceRefresh) {
            console.log(`[API Cache] Using cached data due to rate limiting for ${cacheKey}`);
            const cachedData = imageCache[cacheKey].data;
            
            // If position specified, pick one image from cache
            if (position !== undefined && cachedData.data && cachedData.data.length > 1) {
              const selectedIndex = position % cachedData.data.length;
              return res.json({
                data: [{ 
                  ...cachedData.data[selectedIndex],
                  position: position,
                  isPositionSpecific: true,
                  fromCache: true
                }],
                cached: true,
                rateLimited: true
              });
            }
            
            return res.json({
              ...cachedData,
              cached: true,
              rateLimited: true
            });
          }
          
          // If no cache, return public stock images
          return res.status(429).json({ 
            message: 'Rate limit exceeded for this listing. Please try again later.',
            rateLimited: true 
          });
        }
      }
      
      // Check if we have cached data and it's not expired (cache for 24 hours)
      const cacheExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (
        !forceRefresh && 
        imageCache[cacheKey] && 
        (requestTime - imageCache[cacheKey].timestamp < cacheExpiration)
      ) {
        console.log(`[API Cache] Using cached images for ${customerId}/${listingId}`);
        const cachedData = imageCache[cacheKey].data;
        
        // If position specified, return only that image from cache
        if (position !== undefined && cachedData.data && cachedData.data.length > 1) {
          const selectedIndex = position % cachedData.data.length;
          console.log(`[API Cache] Using cached image at position ${selectedIndex} for requested position ${position}`);
          
          return res.json({
            data: [{ 
              ...cachedData.data[selectedIndex],
              position: position,
              isPositionSpecific: true,
              fromCache: true
            }],
            cached: true
          });
        }
        
        // Return all cached images
        return res.json({
          ...cachedData,
          cached: true
        });
      }
      
      console.log(`[API Route] Fetching images for customer ${customerId}, listing ${listingId}, position ${position}`);
      
      // Get the Hospitable platform token from environment variables
      const token = process.env.HOSPITABLE_PLATFORM_TOKEN;
      if (!token) {
        return res.status(500).json({ message: 'Hospitable platform token not found' });
      }
      
      // Make the request to Hospitable API - first try the images endpoint for newer API
      const url = `https://connect.hospitable.com/api/v1/customers/${customerId}/listings/${listingId}/images`;
      
      // Use the token from environment variable
      const apiToken = process.env.HOSPITABLE_PLATFORM_TOKEN;
      
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Connect-Version': '2022-11-01', // Specific version required by Hospitable API
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        }
      });
      
      // If that endpoint returns a 404, it might be using older API format, try listing details
      if (response.status === 404) {
        console.log('[API Route] Images endpoint returned 404, trying listing details endpoint');
        
        // Try the listing details endpoint which might contain images
        const detailsUrl = `https://connect.hospitable.com/api/v1/customers/${customerId}/listings/${listingId}`;
        response = await fetch(detailsUrl, {
          method: 'GET',
          headers: {
            'Connect-Version': '2022-11-01', // Use specific version for Hospitable API
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiToken}`
          }
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[API Route] HTTP error when fetching images: ${response.status}`, errorData);
        throw new Error(errorData.message || `HTTP error when connecting to Hospitable API: ${response.status}. Make sure your HOSPITABLE_PLATFORM_TOKEN is valid and has the correct permissions.`);
      }
      
      const data = await response.json();
      
      // Format might be different depending on which endpoint we hit
      // If we got data.data format with url and thumbnail_url properties, it's the new format
      // Otherwise, try to extract images from the details structure
      let formattedData = data;
      let allImages: any[] = [];
      
      if (!data.data) {
        // We might have listing details with images nested in a different structure
        // Try to extract and format
        const imagesArray = data.images || [];
        allImages = imagesArray.map((img: any, index: number) => ({
          url: img.url || '',
          thumbnail_url: img.thumbnail_url || img.url || '',
          caption: img.caption || '',
          order: img.position || index
        }));
        formattedData = { data: allImages };
      } else {
        allImages = data.data || [];
      }
      
      // Log summary of images (not the full data which could be large)
      console.log(`[API Route] Retrieved ${allImages.length} images for listing ${listingId}`);
      
      // Ensure all data has unique URLs by adding custom parameters
      const uniqueImages = allImages.map((img: any, index: number) => {
        if (img.url && img.url.includes('muscache.com/im/')) {
          // Replace small image policy with large and add position/index to URL to make it unique
          img.url = img.url.replace(/\?aki_policy=[^&]+/, '?aki_policy=large') + 
            (img.url.includes('?') ? '&' : '?') + `idx=${index}&t=${Date.now()}`;
        } else if (img.url) {
          // For non-muscache URLs, just add a timestamp
          img.url = img.url + (img.url.includes('?') ? '&' : '?') + `idx=${index}&t=${Date.now()}`;
        }
        
        return {
          ...img,
          position: index
        };
      });
      
      // Update the formattedData
      formattedData = { data: uniqueImages };
      
      // Store in cache
      imageCache[cacheKey] = {
        data: formattedData,
        timestamp: Date.now()
      };
      
      // If position specified, return just that image
      if (position !== undefined && uniqueImages.length > 1) {
        const selectedIndex = position % uniqueImages.length;
        const selectedImage = uniqueImages[selectedIndex];
        
        console.log(`[API Route] Selected image ${selectedIndex} for position ${position}`);
        
        if (selectedImage) {
          return res.json({
            data: [{
              ...selectedImage,
              position: position,
              isPositionSpecific: true
            }]
          });
        }
      }
      
      // Return all images
      res.json(formattedData);
    } catch (error: any) {
      console.error('[API Route] Error fetching property images:', error);
      
      // Special handling for rate limiting and "not found" errors from the upstream API
      const isRateLimited = error.message && (
        error.message.includes('Too Many Attempts') || 
        error.message.includes('rate limit') ||
        error.message.includes('429')
      );
      
      const isNotFound = error.message && (
        error.message.includes('No query results for model') ||
        error.message.includes('not found') ||
        error.message.includes('404')
      );
      
      if (isRateLimited || isNotFound) {
        console.log(`[API Route] Using fallback images due to API error: ${error.message}`);
        
        // If a position was requested, return a position-specific fallback
        if (position !== undefined) {
          const fallbackImage = getPositionDependentImage(position);
          return res.json({
            data: [fallbackImage],
            fallback: true,
            rateLimited: isRateLimited,
            notFound: isNotFound,
            originalError: error.message
          });
        }
        
        // Otherwise return all fallbacks (just one for now)
        return res.json({
          data: fallbackImages.map((img, idx) => ({
            ...img,
            position: idx,
            fromFallback: true
          })),
          fallback: true,
          rateLimited: isRateLimited,
          notFound: isNotFound,
          originalError: error.message
        });
      }
      
      // For other errors, return a proper error response
      res.status(500).json({ 
        message: error.message || 'Failed to fetch property images', 
        error: error.toString() 
      });
    }
  });

  app.post('/api/hospitable/mark-for-publishing', async (req: Request, res: Response) => {
    try {
      console.log('/api/hospitable/mark-for-publishing API route called (wrong one)');
      // Extract customer ID and listing IDs from request body
      const { customerId, listingIds } = req.body;
      
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required' });
      }
      
      if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
        return res.status(400).json({ message: 'At least one listing ID is required' });
      }
      
      console.log(`[API Route] Marking ${listingIds.length} listings for publishing for customer: ${customerId}`);
      
      // Use the platform token for this operation
      const token = process.env.HOSPITABLE_PLATFORM_TOKEN;
      
      if (!token) {
        return res.status(401).json({ message: 'Hospitable platform token not found in environment' });
      }

      const client = new HospitableAPI({
        apiToken: token,
        baseUrl: 'https://connect.hospitable.com'
      });

      // Fetch customer listings from Hospitable API to ensure we have the latest data
      const response = await client.getCustomerListings(customerId);
      const hospProperties = response?.data || response;
      
      if (!hospProperties?.length) {
        return res.status(404).json({ message: 'No properties found in Hospitable account' });
      }
      
      // Filter to only include the properties selected for publishing
      const selectedProperties = hospProperties.filter(prop => 
        listingIds.includes(prop.id) || listingIds.includes(prop.id.toString())
      );
      
      if (selectedProperties.length === 0) {
        return res.status(404).json({ message: 'None of the selected properties were found' });
      }
      
      console.log(`[API Route] Found ${selectedProperties.length} of ${listingIds.length} selected properties`);
      
      // Import and mark selected properties for publishing
      let publishedProperties = [];
      
      for (const prop of selectedProperties) {
        try {
          // Format the platformId as customerId/listingId for better compatibility with Hospitable API
          const combinedPlatformId = `${customerId}/${prop.id}`;
          
          // Check if property already exists by platformId (store Hospitable IDs as strings)
          const existingProperties = await storage.searchProperties(`platformId:${combinedPlatformId}`, {});
          let existingProperty = existingProperties.length > 0 ? existingProperties[0] : undefined;
          
          const propertyData = {
            name: prop.private_name || prop.public_name || 'Unnamed Property',
            title: prop.public_name || prop.private_name || 'Unnamed Property',
            description: prop.description || 'Beautiful property',
            price: Number(prop.base_price) || 99,
            imageUrl: (prop.picture || prop.photos?.[0]?.url || '').replace('/im\\', '/'),
            additionalImages: prop.photos?.slice(1).map(p => p.url.replace('/im\\', '/')) || [],
            address: prop.address || '',
            city: prop.city || 'Unknown',
            state: prop.state || '',
            country: prop.country || 'Unknown',
            location: `${prop.city || ''}, ${prop.state || ''}, ${prop.country || ''}`.replace(/, ,/g, ',').replace(/^, /, '').replace(/, $/, ''),
            latitude: prop.latitude ? Number(prop.latitude) : null,
            longitude: prop.longitude ? Number(prop.longitude) : null,
            bedrooms: prop.bedrooms ? Number(prop.bedrooms) : 1,
            bathrooms: prop.bathrooms ? Number(prop.bathrooms) : 1,
            maxGuests: prop.max_guests ? Number(prop.max_guests) : 2,
            // Store the detailed capacity object from the Hospitable API
            capacity: prop.capacity ? {
              max: prop.capacity.max ? Number(prop.capacity.max) : (prop.max_guests ? Number(prop.max_guests) : 2),
              beds: prop.capacity.beds ? Number(prop.capacity.beds) : (prop.beds ? Number(prop.beds) : 1),
              bedrooms: prop.capacity.bedrooms ? Number(prop.capacity.bedrooms) : (prop.bedrooms ? Number(prop.bedrooms) : 1),
              bathrooms: prop.capacity.bathrooms ? Number(prop.capacity.bathrooms) : (prop.bathrooms ? Number(prop.bathrooms) : 1)
            } : null,
            amenities: prop.amenities || [],
            hostId: 1, // Default host ID
            hostName: 'Property Owner',
            rating: 4.5,
            reviewCount: 0,
            type: prop.property_type || 'Apartment',
            isFeatured: true,
            isActive: true,
            isVerified: true,
            isPublished: true, // Mark as published
            publishedAt: new Date(), // Set published timestamp
            metaTitle: prop.public_name || prop.private_name,
            metaDescription: prop.description?.substring(0, 160) || 'Book this amazing property directly with the owner',
            keywords: ['vacation rental', 'direct booking', prop.city || '', prop.property_type || ''],
            rules: prop.house_rules || '',
            checkInTime: '15:00',
            checkOutTime: '11:00',
            minNights: prop.min_nights ? Number(prop.min_nights) : 1,
            maxNights: prop.max_nights ? Number(prop.max_nights) : 30,
            platformId: combinedPlatformId, // Use combined format: customerId/listingId
            platformType: 'hospitable',
            externalId: prop.id
          };
          
          let property;
          try {
            if (existingProperty) {
              // Update existing property and mark as published
              property = await storage.updateProperty(existingProperty.id, propertyData);
              console.log(`[API Route] Updated and published existing property ${existingProperty.id}`);
            } else {
              // Check if a property with the same slug exists
              const slug = (propertyData.title || propertyData.name || 'property')
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
                
              const existingWithSlug = await storage.getPropertyBySlug(slug);
              
              if (existingWithSlug) {
                // If exists, update instead of creating
                property = await storage.updateProperty(existingWithSlug.id, {
                  ...propertyData,
                  // Add unique timestamp to slug to avoid collision
                  slug: `${slug}-${Date.now().toString().slice(-6)}`
                });
                console.log(`[API Route] Updated existing property with same slug ${existingWithSlug.id}`);
              } else {
                // Create new property and mark as published
                property = await storage.createProperty(propertyData);
                console.log(`[API Route] Created and published new property ${property.id}`);
              }
            }
          } catch (error) {
            console.error('[API Route] Error with property operation:', error);
            // Continue to next property despite error
            continue;
          }
          
          publishedProperties.push(property);
        } catch (error) {
          console.error('[API Route] Error publishing property:', error);
          // Continue with other properties even if one fails
        }
      }
      
      console.log(`[API Route] Successfully published ${publishedProperties.length} properties`);
      
      // Process images in batches to avoid rate limiting
      const batchSize = 2; // Process just 2 properties at a time to stay within API limits
      const delay = 10000; // 10 second delay between batches
      
      // Function to process a batch of properties
      const processBatch = async (batch: any[]) => {
        console.log(`[API Route] Processing batch of ${batch.length} properties for image storage`);
        
        for (const property of batch) {
          // Make sure property exists and has either platformId or external_id field (from Hospitable API)
          if (property && typeof property === 'object' && 'id' in property && 
             (('platformId' in property && property.platformId) || 
              ('external_id' in property && property.external_id))) {
            try {
              const propertyId = property.id;
              // Use platformId if available, otherwise fall back to external_id
              const platformId = ('platformId' in property && property.platformId) 
                ? property.platformId.toString() 
                : property.external_id.toString();
              
              console.log(`[API Route] Fetching and storing images for property ${propertyId} with platformId ${platformId}`);
              
              // Extract the customerId and listingId from the platformId
              const { customerId: extractedCustomerId, listingId: extractedListingId } = extractPropertyIds(platformId);
              
              // If we can't extract both IDs, skip this property
              if (!extractedCustomerId || !extractedListingId) {
                console.warn(`[API Route] Invalid platformId format ${platformId} for property ${propertyId}. Skipping.`);
                continue;
              }
              
              console.log(`[API Route] Using ${extractedCustomerId}/${extractedListingId} for API call`);
              
              // Download images for the property
              const images = await downloadAndStorePropertyImages(extractedCustomerId, extractedListingId);
              
              if (images && images.length > 0) {
                // Store the images in the database
                await storePropertyImages(platformId, images);
                console.log(`[API Route] Successfully stored ${images.length} images for property ${propertyId}`);
              } else {
                console.log(`[API Route] No images found for property ${propertyId}`);
              }
              
              // Add a short delay between properties within the same batch
              if (batch.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
              }
            } catch (error) {
              console.error(`[API Route] Error fetching images for property ${property.id}:`, error);
              // Continue with other properties even if image fetching fails
            }
          }
        }
      };
      
      // Process properties in batches with delays
      for (let i = 0; i < publishedProperties.length; i += batchSize) {
        const batch = publishedProperties.slice(i, i + batchSize);
        
        // Process this batch
        await processBatch(batch);
        
        // If there are more batches, add a delay before processing the next one
        if (i + batchSize < publishedProperties.length) {
          console.log(`[API Route] Waiting ${delay/1000} seconds before processing next batch...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      res.status(200).json(publishedProperties);
    } catch (error) {
      console.error('[API Route] Error marking properties for publishing:', error);
      res.status(500).json({ 
        message: 'Error marking properties for publishing',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Manual image fetching for a single property
  app.post('/api/hospitable/fetch-property-images', async (req: Request, res: Response) => {
    try {
      console.log('/api/hospitable/fetch-property-images API route called (wrong one)');
      const { propertyId, platformId } = req.body;
      
      if (!propertyId || !platformId) {
        return res.status(400).json({ message: 'propertyId and platformId are required' });
      }
      
      // Extract customerId and listingId from platformId
      console.log(`[API Route] Received fetch request for property ${propertyId} with platformId "${platformId}"`);
      
      const { customerId, listingId } = extractPropertyIds(platformId.toString());
      
      console.log(`[API Route] Extracted IDs: customerId=${customerId}, listingId=${listingId}`);
      
      if (!customerId || !listingId) {
        return res.status(400).json({ 
          message: 'Invalid platformId format',
          detail: 'Platform ID must be in the format "customerId/listingId" or "customerId:listingId"',
          received: platformId
        });
      }
      
      console.log(`[API Route] Manually fetching images for property ${propertyId} with platformId ${platformId}`);
      
      // Get images from Hospitable API with rate limiting built in
      const images = await downloadAndStorePropertyImages(customerId, listingId);
      
      if (images && images.length > 0) {
        // Store the images in the database
        await storePropertyImages(platformId.toString(), images);
        
        // Update the property record to indicate that images were stored
        const [updatedProperty] = await db.update(properties)
          .set({ 
            imagesStoredAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(properties.id, Number(propertyId)))
          .returning();
        
        console.log(`[API Route] Successfully stored ${images.length} images for property ${propertyId}`);
        
        return res.status(200).json({
          success: true,
          message: `Successfully fetched and stored ${images.length} images`,
          property: updatedProperty,
          imageCount: images.length
        });
      } else {
        console.log(`[API Route] No images found for property ${propertyId}`);
        return res.status(404).json({
          success: false,
          message: 'No images found for this property'
        });
      }
    } catch (error) {
      console.error('[API Route] Error fetching property images:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error fetching property images',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post(hospitable.connect, async (req: Request, res: Response) => {
    try {
      console.log(`${hospitable.connect} API route called (wrong one)`);
      const { action } = req.query;

      if (!action) {
        console.log('Missing action parameter');
        return res.status(400).json({ error: 'Action parameter is required' });
      }

      switch (action) {
        case 'customer':
          try {
            const customerData = req.body;
            console.log('[API Route] Received customer data');
            
            // Forward directly to the Hospitable API
            console.log('[API Route] Sending request to Hospitable API...');
            const response = await fetch('https://connect.hospitable.com/api/v1/customers', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + process.env.HOSPITABLE_PLATFORM_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Connect-Version': '2024-01'
              },
              body: JSON.stringify(customerData)
            });

            const data = await response.json();
            console.log('[API Route] Hospitable API customer response received');
            console.log('[API Route] Customer data structure:', JSON.stringify(data, null, 2));

            if (!response.ok) {
              console.error('[API Route] Error from Hospitable API:', data);
              return res.status(response.status).json({ 
                error: data.error || 'Failed to create customer',
                details: data.details || {}
              });
            }

            // Generate auth code
            console.log('[API Route] Generating auth code...');
            const authRequestBody = {
              customer_id: data.data.id, // Correctly access customer ID from response
              redirect_url: req.body.redirect_url || (req.protocol + '://' + req.get('host') + '/auth/callback')
            };
            console.log('[API Route] Auth code request:', JSON.stringify(authRequestBody, null, 2));
            
            const authResponse = await fetch('https://connect.hospitable.com/api/v1/auth-codes', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + process.env.HOSPITABLE_PLATFORM_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Connect-Version': '2024-01'
              },
              body: JSON.stringify({
                customer_id: data.data.id, // Correctly access customer ID from response
                redirect_url: req.body.redirect_url || (req.protocol + '://' + req.get('host') + '/auth/callback')
              })
            });

            const authData = await authResponse.json();
            console.log('[API Route] Auth code response received');
            console.log('[API Route] Auth code response:', JSON.stringify(authData, null, 2));

            if (!authResponse.ok) {
              console.error('[API Route] Error generating auth code:', authData);
              return res.status(authResponse.status).json({ 
                error: authData.error || 'Failed to generate auth code',
                details: authData.details || {}
              });
            }

            // Format the response to match client expectations
            const result = {
              customer: {
                id: data.data.id,
                email: data.data.email,
                name: data.data.name,
                phone: data.data.phone,
                timezone: data.data.timezone
              },
              authUrl: authData.data.return_url,
              expiresAt: authData.data.expires_at
            };
            console.log('[API Route] Sending successful response:');
            console.log('[API Route] Result data:', JSON.stringify(result, null, 2));
            return res.json(result);
          } catch (error: any) {
            console.error('[API Route] Error processing customer data:', error);
            return res.status(500).json({ 
              error: error.message || 'Internal server error' 
            });
          }

        default:
          console.log('[API Route] Invalid action:', action);
          return res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error: any) {
      console.error('[API Route] API error:', error);
      res.status(500).json({ 
        error: error.message || 'Internal server error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
