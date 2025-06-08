import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (basic users schema, kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  fullName: text("full_name"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations will be defined after all tables are declared

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  // Basic info
  name: text("name").notNull(), // Internal name (private_name)
  title: text("title"), // Public title (public_name)
  description: text("description").notNull(),
  location: text("location").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").notNull(),
  neighborhood: text("neighborhood"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  
  // Property details
  price: integer("price").notNull(), // price per night
  weekendPrice: integer("weekend_price"),
  weeklyPrice: integer("weekly_price"),
  monthlyPrice: integer("monthly_price"),
  cleaningFee: integer("cleaning_fee"),
  serviceFee: integer("service_fee"),
  taxRate: doublePrecision("tax_rate"),
  minStay: integer("min_stay").default(1),
  maxStay: integer("max_stay"),
  
  // Ratings and reviews
  rating: doublePrecision("rating"), // average rating
  reviewCount: integer("review_count").default(0),
  
  // Property characteristics
  type: text("type").default("Apartment"), // Type of property (Apartment, Villa, House, etc.)
  propertySize: integer("property_size"), // in square feet
  yearBuilt: integer("year_built"),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  maxGuests: integer("max_guests").notNull(),
  amenities: text("amenities").array(),
  featuredAmenities: text("featured_amenities").array(),
  capacity: jsonb("capacity").$type<{
    max: number;      // Maximum number of guests
    beds: number;     // Total number of beds
    bedrooms: number; // Number of bedrooms
    bathrooms: number; // Number of bathrooms
  }>(),
  bedroomDetails: jsonb("bedroom_details").$type<Array<{
    id: number;
    name: string;
    beds: Array<{type: string; count: number}>;
    image: string;
  }>>(),
  
  // Media
  imageUrl: text("image_url").notNull(),
  additionalImages: text("additional_images").array(), // array of image URLs
  videoUrl: text("video_url"),
  virtualTourUrl: text("virtual_tour_url"),
  imagesStoredAt: timestamp("images_stored_at"), // When images were last downloaded and stored
  
  // Host information
  hostId: integer("host_id").notNull(),
  hostName: text("host_name").notNull(),
  hostImage: text("host_image"),
  
  // Widgets and integrations
  bookingWidgetUrl: text("booking_widget_url"), // URL for property-specific booking widget
  reviewWidgetCode: text("review_widget_code"), // Widget code for Revyoos
  calendarSyncUrl: text("calendar_sync_url"), // iCal feed URL
  propertyManagementSystemId: text("pms_id"), // ID in external property management system
  channelManagerId: text("channel_manager_id"), // ID in external channel manager
  
  // External API data
  externalId: text("external_id"), // ID from the external API
  externalSource: text("external_source"), // Source of the external data (e.g., "airbnb", "vrbo")
  platformId: text("platform_id"), // Combined ID format: "customerId:listingId" for Hospitable API
  lastSyncedAt: timestamp("last_synced_at"),
  
  // SEO fields
  slug: text("slug").unique(), // URL-friendly version of the name
  metaTitle: text("meta_title"), // Custom SEO title
  metaDescription: text("meta_description"), // Custom SEO description
  canonicalUrl: text("canonical_url"), // Custom canonical URL
  keywords: text("keywords").array(), // SEO keywords
  
  // Flags and status
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  status: text("status").default("active"), // active, pending, inactive
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  
});

// Define relations for properties
// Relations will be defined later to avoid circular dependencies

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

// Cities table (for city pages)
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  state: text("state"),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  imageUrl: text("image_url").notNull(),
  additionalImages: text("additional_images").array(),
  propertyCount: integer("property_count").default(0),
  featured: boolean("featured").default(false),
  
  // SEO fields
  slug: text("slug").unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords").array(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations will be defined later to avoid circular dependencies

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  userImage: text("user_image"),
  rating: doublePrecision("rating").notNull(),
  title: text("title"),
  comment: text("comment").notNull(),
  response: text("response"), // Host response to the review
  responseDate: timestamp("response_date"),
  isVerified: boolean("is_verified").default(false),
  date: timestamp("date").defaultNow(),
});

// Relations will be defined later to avoid circular dependencies

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  date: true,
  responseDate: true,
});

// Neighborhoods table
export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cityId: integer("city_id").notNull(),
  description: text("description"),
  longDescription: text("long_description"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  imageUrl: text("image_url").notNull(),
  additionalImages: text("additional_images").array(),
  propertyCount: integer("property_count").default(0),
  
  // SEO fields
  slug: text("slug").unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations will be defined later to avoid circular dependencies

export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Favorite properties (for users to save properties they like)
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  propertyId: integer("property_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations will be defined later to avoid circular dependencies

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// API Integration table - for tracking external API services
export const apiIntegrations = pgTable("api_integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(), // Property management system, channel manager, etc.
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  baseUrl: text("base_url"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  syncFrequency: text("sync_frequency").default("daily"), // hourly, daily, weekly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertApiIntegrationSchema = createInsertSchema(apiIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ApiIntegration = typeof apiIntegrations.$inferSelect;
export type InsertApiIntegration = z.infer<typeof insertApiIntegrationSchema>;

// Export types for database entities
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
