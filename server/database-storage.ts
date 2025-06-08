import { 
  users, type User, type InsertUser,
  properties, type Property, type InsertProperty,
  cities, type City, type InsertCity,
  reviews, type Review, type InsertReview,
  neighborhoods, type Neighborhood, type InsertNeighborhood,
  favorites, type Favorite, type InsertFavorite
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, like, gte, lte, desc, sql, ilike } from "drizzle-orm";

// Import relations to make them available
import "../shared/relations";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  // Properties
  async getProperties(limit = 10, offset = 0): Promise<Property[]> {
    return await db.select()
      .from(properties)
      .where(eq(properties.isActive, true))
      .orderBy(desc(properties.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getFeaturedProperties(limit = 4): Promise<Property[]> {
    try {
      return await db.select()
        .from(properties)
        .where(and(
          eq(properties.isActive, true),
          eq(properties.isFeatured, true)
        ))
        .limit(limit);
    } catch (error) {
      console.error("Error in getFeaturedProperties:", error);
      // Return the most recent properties as fallback
      return await db.select()
        .from(properties)
        .where(eq(properties.isActive, true))
        .orderBy(desc(properties.createdAt))
        .limit(limit);
    }
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select()
      .from(properties)
      .where(eq(properties.id, id));
    return property;
  }
  
  async getPropertyBySlug(slug: string): Promise<Property | undefined> {
    const [property] = await db.select()
      .from(properties)
      .where(eq(properties.slug, slug));
    return property;
  }
  
  async getPropertyByExternalId(externalId: string): Promise<Property | undefined> {
    const [property] = await db.select()
      .from(properties)
      .where(eq(properties.externalId, externalId));
    return property;
  }

  async getPropertyByPlatformId(platformId: string): Promise<Property | undefined> {
    const [property] = await db.select()
      .from(properties)
      .where(eq(properties.platformId, platformId));
    return property;
  }

  // Retrieve all customer listings by customerId. Use platformId in format "customerId:listingId" for retrieval logic
  async getPropertiesByCustomerId(customerId: string, offset = 0): Promise<Property[]> {
    return await db.select()
      .from(properties)
      .where(like(properties.platformId, `${customerId}:%`))
      .orderBy(desc(properties.createdAt))
      .offset(offset);
  }

  async updatePropertyByExternalId(externalId: string, propertyData: Partial<InsertProperty>): Promise<Property> {
    const [updatedProperty] = await db.update(properties)
      .set({ ...propertyData, updatedAt: new Date() })
      .where(eq(properties.externalId, externalId))
      .returning();
    return updatedProperty;
  }

  async getPropertiesByCity(cityName: string, limit = 10, offset = 0): Promise<Property[]> {
    return await db.select()
      .from(properties)
      .where(and(
        eq(properties.isActive, true),
        ilike(properties.city, `%${cityName}%`)
      ))
      .limit(limit)
      .offset(offset);
  }

  async searchProperties(query: string, filters?: any): Promise<Property[]> {
    try {
      // Handle special case for isPublished
      if (query === 'isPublished:true') {
        return await db.select()
          .from(properties)
          .where(and(
            eq(properties.isActive, true),
            sql`${properties.publishedAt} IS NOT NULL`
          ));
      } else if (query === 'isPublished:false') {
        return await db.select()
          .from(properties)
          .where(and(
            eq(properties.isActive, true),
            sql`${properties.publishedAt} IS NULL`
          ));
      }

      // Build conditions array for regular search
      const conditions = [
        eq(properties.isActive, true),
        sql`(
          ${properties.name} ILIKE ${`%${query}%`} OR
          ${properties.city} ILIKE ${`%${query}%`} OR
          ${properties.country} ILIKE ${`%${query}%`} OR
          ${properties.location} ILIKE ${`%${query}%`}
        )`
      ];
      
      // Add filter conditions
      if (filters) {
        if (filters.minPrice) {
          conditions.push(gte(properties.price, filters.minPrice));
        }
        if (filters.maxPrice) {
          conditions.push(lte(properties.price, filters.maxPrice));
        }
        if (filters.bedrooms) {
          conditions.push(gte(properties.bedrooms, filters.bedrooms));
        }
        if (filters.bathrooms) {
          conditions.push(gte(properties.bathrooms, filters.bathrooms));
        }
        if (filters.maxGuests) {
          conditions.push(gte(properties.maxGuests, filters.maxGuests));
        }
        if (filters.type) {
          conditions.push(eq(properties.type, filters.type));
        }
        if (filters.isPublished !== undefined) {
          if (filters.isPublished === true) {
            conditions.push(sql`${properties.publishedAt} IS NOT NULL`);
          } else {
            conditions.push(sql`${properties.publishedAt} IS NULL`);
          }
        }
      }

      // Execute query with all conditions
      return await db.select()
        .from(properties)
        .where(and(...conditions));
    } catch (error) {
      console.error("Error in searchProperties:", error);
      return [];
    }
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    // Generate slug from title (or name if title is not available) if not provided
    if (!property.slug) {
      const slugSource = property.title || property.name;
      property.slug = slugSource
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const [createdProperty] = await db.insert(properties)
      .values(property)
      .returning();
    
    return createdProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updatedProperty] = await db.update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // Soft delete by setting isActive to false
    const [updatedProperty] = await db.update(properties)
      .set({
        isActive: false
      })
      .where(eq(properties.id, id))
      .returning();
    
    return !!updatedProperty;
  }

  // Cities
  async getCities(limit = 10): Promise<City[]> {
    return await db.select()
      .from(cities)
      .limit(limit);
  }

  async getFeaturedCities(limit = 4): Promise<City[]> {
    return await db.select()
      .from(cities)
      .where(eq(cities.featured, true))
      .limit(limit);
  }

  async getCity(id: number): Promise<City | undefined> {
    const [city] = await db.select()
      .from(cities)
      .where(eq(cities.id, id));
    return city;
  }

  async getCityByName(name: string): Promise<City | undefined> {
    const [city] = await db.select()
      .from(cities)
      .where(ilike(cities.name, name));
    return city;
  }

  async createCity(city: InsertCity): Promise<City> {
    // Generate slug from name if not provided
    if (!city.slug) {
      city.slug = city.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const [createdCity] = await db.insert(cities)
      .values(city)
      .returning();
    
    return createdCity;
  }

  async updateCity(id: number, city: Partial<InsertCity>): Promise<City | undefined> {
    const [updatedCity] = await db.update(cities)
      .set(city)
      .where(eq(cities.id, id))
      .returning();
    
    return updatedCity;
  }

  async deleteCity(id: number): Promise<boolean> {
    const result = await db.delete(cities)
      .where(eq(cities.id, id));
    
    return !!result.rowCount && result.rowCount > 0;
  }

  // Reviews
  async getReviews(propertyId: number): Promise<Review[]> {
    return await db.select()
      .from(reviews)
      .where(eq(reviews.propertyId, propertyId))
      .orderBy(desc(reviews.date));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [createdReview] = await db.insert(reviews)
      .values(review)
      .returning();
    
    // Update property rating and review count
    await this.updatePropertyRating(review.propertyId);
    
    return createdReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [deletedReview] = await db.delete(reviews)
      .where(eq(reviews.id, id))
      .returning();
    
    if (deletedReview) {
      // Update property rating and review count
      await this.updatePropertyRating(deletedReview.propertyId);
      return true;
    }
    
    return false;
  }

  private async updatePropertyRating(propertyId: number): Promise<void> {
    // Get all reviews for the property
    const propertyReviews = await this.getReviews(propertyId);
    
    // Calculate average rating
    const totalRating = propertyReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = propertyReviews.length > 0 
      ? totalRating / propertyReviews.length 
      : 0;
    
    // Update the property
    await db.update(properties)
      .set({
        rating: avgRating,
        reviewCount: propertyReviews.length
      })
      .where(eq(properties.id, propertyId));
  }

  // Neighborhoods
  async getNeighborhoods(cityId: number): Promise<Neighborhood[]> {
    return await db.select()
      .from(neighborhoods)
      .where(eq(neighborhoods.cityId, cityId));
  }

  async createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood> {
    // Generate slug from name if not provided
    if (!neighborhood.slug) {
      neighborhood.slug = neighborhood.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const [createdNeighborhood] = await db.insert(neighborhoods)
      .values(neighborhood)
      .returning();
    
    return createdNeighborhood;
  }

  // Favorites
  async getFavorites(userId: number): Promise<Property[]> {
    const result = await db.select({
      property: properties
    })
    .from(favorites)
    .innerJoin(properties, eq(favorites.propertyId, properties.id))
    .where(eq(favorites.userId, userId));
    
    return result.map(r => r.property);
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [createdFavorite] = await db.insert(favorites)
      .values(favorite)
      .returning();
    
    return createdFavorite;
  }

  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.propertyId, propertyId)
      ));
    
    return !!result.rowCount && result.rowCount > 0;
  }

  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    const [favorite] = await db.select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.propertyId, propertyId)
      ));
    
    return !!favorite;
  }
}