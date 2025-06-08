import { 
  users, type User, type InsertUser,
  properties, type Property, type InsertProperty,
  cities, type City, type InsertCity,
  reviews, type Review, type InsertReview,
  neighborhoods, type Neighborhood, type InsertNeighborhood,
  favorites, type Favorite, type InsertFavorite
} from "@shared/schema";

// Extend the storage interface with the CRUD methods for all entities
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Properties
  getProperties(limit?: number, offset?: number): Promise<Property[]>;
  getFeaturedProperties(limit?: number): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getPropertyBySlug(slug: string): Promise<Property | undefined>;
  getPropertiesByCity(cityName: string, limit?: number, offset?: number): Promise<Property[]>;
  searchProperties(query: string, filters?: any): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Cities
  getCities(limit?: number): Promise<City[]>;
  getFeaturedCities(limit?: number): Promise<City[]>;
  getCity(id: number): Promise<City | undefined>;
  getCityByName(name: string): Promise<City | undefined>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: number, city: Partial<InsertCity>): Promise<City | undefined>;
  deleteCity(id: number): Promise<boolean>;
  
  // Reviews
  getReviews(propertyId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  deleteReview(id: number): Promise<boolean>;
  
  // Neighborhoods
  getNeighborhoods(cityId: number): Promise<Neighborhood[]>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
  
  // Favorites
  getFavorites(userId: number): Promise<Property[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;
  isFavorite(userId: number, propertyId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private cities: Map<number, City>;
  private reviews: Map<number, Review>;
  private neighborhoods: Map<number, Neighborhood>;
  private favorites: Map<number, Favorite>;
  
  private userIdCounter: number;
  private propertyIdCounter: number;
  private cityIdCounter: number;
  private reviewIdCounter: number;
  private neighborhoodIdCounter: number;
  private favoriteIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.cities = new Map();
    this.reviews = new Map();
    this.neighborhoods = new Map();
    this.favorites = new Map();
    
    this.userIdCounter = 1;
    this.propertyIdCounter = 1;
    this.cityIdCounter = 1;
    this.reviewIdCounter = 1;
    this.neighborhoodIdCounter = 1;
    this.favoriteIdCounter = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      email: insertUser.email ?? null,
      fullName: insertUser.fullName ?? null,
      isAdmin: null,
      createdAt: null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Properties
  async getProperties(limit = 10, offset = 0): Promise<Property[]> {
    return Array.from(this.properties.values())
      .slice(offset, offset + limit);
  }
  
  async getFeaturedProperties(limit = 4): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => property.isFeatured)
      .slice(0, limit);
  }
  
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }
  
  async getPropertyBySlug(slug: string): Promise<Property | undefined> {
    return Array.from(this.properties.values()).find(
      property => property.slug === slug
    );
  }
  
  async getPropertiesByCity(cityName: string, limit = 10, offset = 0): Promise<Property[]> {
    return Array.from(this.properties.values())
      .filter(property => property.city.toLowerCase() === cityName.toLowerCase())
      .slice(offset, offset + limit);
  }
  
  async searchProperties(query: string, filters?: any): Promise<Property[]> {
    // Handle special case for isPublished
    if (query === 'isPublished:true') {
      return Array.from(this.properties.values())
        .filter(property => property.publishedAt !== null && property.publishedAt !== undefined);
    } else if (query === 'isPublished:false') {
      return Array.from(this.properties.values())
        .filter(property => property.publishedAt === null || property.publishedAt === undefined);
    }
    
    const searchTerm = query.toLowerCase();
    let results = Array.from(this.properties.values()).filter(property => {
      return (
        property.name.toLowerCase().includes(searchTerm) ||
        property.city.toLowerCase().includes(searchTerm) ||
        property.country.toLowerCase().includes(searchTerm) ||
        property.location.toLowerCase().includes(searchTerm)
      );
    });
    
    // Apply filters if they exist
    if (filters) {
      if (filters.minPrice) {
        results = results.filter(p => p.price >= filters.minPrice);
      }
      if (filters.maxPrice) {
        results = results.filter(p => p.price <= filters.maxPrice);
      }
      if (filters.bedrooms) {
        results = results.filter(p => p.bedrooms >= filters.bedrooms);
      }
      if (filters.isPublished !== undefined) {
        if (filters.isPublished === true) {
          results = results.filter(p => p.publishedAt !== null && p.publishedAt !== undefined);
        } else {
          results = results.filter(p => p.publishedAt === null || p.publishedAt === undefined);
        }
      }
      // Add more filters as needed
    }
    
    return results;
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.propertyIdCounter++;
    const newProperty: Property = {
      // Required fields (must be present in InsertProperty)
      name: property.name,
     
      description: property.description,
      location: property.location,
      city: property.city,
      country: property.country,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.maxGuests,
      imageUrl: property.imageUrl,
      hostId: property.hostId,
      hostName: property.hostName,
      maxStay: property.maxStay ?? null, // Add default value for maxStay
    
      // Fields with defaults
      id,
      type: property.type ?? 'Apartment',
      rating: property.rating ?? 0,
      reviewCount: property.reviewCount ?? 0,
      minStay: property.minStay ?? 1,
      status: property.status ?? 'active',
      isVerified: property.isVerified ?? false,
      isFeatured: property.isFeatured ?? false,
      isActive: property.isActive ?? true,
    
      // Array fields (schema says array, not null)
      amenities: (property.amenities as string[]) ?? [],
      additionalImages: property.additionalImages ?? [],
      keywords: property.keywords ?? [],
    
      // JSON fields
      bedroomDetails: (property.bedroomDetails as { id: number; name: string; beds: { type: string; count: number; }[]; image: string; }[]) ?? [],
    
      // Numeric fields
      weekendPrice: property.weekendPrice ?? null,
      weeklyPrice: property.weeklyPrice ?? null,
      monthlyPrice: property.monthlyPrice ?? null,
      cleaningFee: property.cleaningFee ?? null,
      serviceFee: property.serviceFee ?? null,
      taxRate: property.taxRate ?? null,
      propertySize: property.propertySize ?? null,
      yearBuilt: property.yearBuilt ?? null,
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
    
      // String fields
      state: property.state ?? null,
      zipCode: property.zipCode ?? null,
      neighborhood: property.neighborhood ?? null,
      videoUrl: property.videoUrl ?? null,
      virtualTourUrl: property.virtualTourUrl ?? null,
      hostImage: property.hostImage ?? null,
      bookingWidgetUrl: property.bookingWidgetUrl ?? null,
      reviewWidgetCode: property.reviewWidgetCode ?? null,
      calendarSyncUrl: property.calendarSyncUrl ?? null,
      propertyManagementSystemId: property.propertyManagementSystemId ?? null,
      channelManagerId: property.channelManagerId ?? null,
      externalId: property.externalId ?? null,
      externalSource: property.externalSource ?? null,
      slug: property.slug ?? null,
      metaTitle: property.metaTitle ?? null,
      metaDescription: property.metaDescription ?? null,
      canonicalUrl: property.canonicalUrl ?? null,
      title: property.title ?? null,
      featuredAmenities: (property.featuredAmenities as string[]) ?? [],
      capacity: property.capacity ?? {
        max: property.maxGuests ?? 0,
        beds: 0,
        bedrooms: property.bedrooms ?? 0,
        bathrooms: property.bathrooms ?? 0,
      },
      imagesStoredAt: property.imagesStoredAt ?? null,
      platformId: property.platformId ?? null,

    
      // Date fields
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt:  null,
      lastSyncedAt: property.lastSyncedAt ?? null,
    };
    this.properties.set(id, newProperty);
    return newProperty;
  }
  
async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
  const existingProperty = this.properties.get(id);
  if (!existingProperty) return undefined;

  let updatedBedroomDetails = existingProperty.bedroomDetails;
  if (property.bedroomDetails) {
    updatedBedroomDetails = normalizeBedroomDetails(property.bedroomDetails);
  }

  const updatedProperty = { 
    ...existingProperty, 
    ...property, 
    bedroomDetails: updatedBedroomDetails 
  };
  this.properties.set(id, updatedProperty);
  return updatedProperty;
}
  
  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }
  
  // Cities
  async getCities(limit = 10): Promise<City[]> {
    return Array.from(this.cities.values()).slice(0, limit);
  }
  
  async getFeaturedCities(limit = 4): Promise<City[]> {
    return Array.from(this.cities.values())
      .filter(city => city.featured)
      .slice(0, limit);
  }
  
  async getCity(id: number): Promise<City | undefined> {
    return this.cities.get(id);
  }
  
  async getCityByName(name: string): Promise<City | undefined> {
    return Array.from(this.cities.values()).find(
      city => city.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async createCity(city: InsertCity): Promise<City> {
    const id = this.cityIdCounter++;
    const newCity: City = { 
      ...city, 
      id,
      name: city.name,
      country: city.country,
      state: city.state ?? null,
      description: city.description,
      longDescription: city.longDescription ?? null,
      latitude: city.latitude ?? null,
      longitude: city.longitude ?? null,
      imageUrl: city.imageUrl,
      additionalImages: city.additionalImages ?? [],
      propertyCount: city.propertyCount ?? 0,
      featured: city.featured ?? false,
      slug: city.slug ?? null,
      metaTitle: city.metaTitle ?? null,
      metaDescription: city.metaDescription ?? null,
      keywords: city.keywords ?? [],
      
      createdAt: new Date(),
      updatedAt: new Date(), 
    };
    this.cities.set(id, newCity);
    return newCity;
  }
  
  async updateCity(id: number, city: Partial<InsertCity>): Promise<City | undefined> {
    const existingCity = this.cities.get(id);
    if (!existingCity) return undefined;
    
    const updatedCity = { ...existingCity, ...city };
    this.cities.set(id, updatedCity);
    return updatedCity;
  }
  
  async deleteCity(id: number): Promise<boolean> {
    return this.cities.delete(id);
  }
  
  // Reviews
  async getReviews(propertyId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.propertyId === propertyId);
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const newReview: Review = { 
      ...review, 
      id, 
      date: new Date(),
      responseDate: null, // Default value for responseDate
      userImage: review.userImage ?? null, // Esure userImage is not undefined
      isVerified: review.isVerified ?? false, // Default value for isVerified
      response: null,  // Default value for response
      title: review.title ?? null, // Default value for title
    };
    this.reviews.set(id, newReview);
    
    // Update the property's rating and review count
    const property = this.properties.get(review.propertyId);
    if (property) {
      const propertyReviews = await this.getReviews(review.propertyId);
      const totalRating = propertyReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / propertyReviews.length;
      
      this.properties.set(property.id, {
        ...property,
        rating: avgRating,
        reviewCount: propertyReviews.length
      });
    }
    
    return newReview;
  }
  
  async deleteReview(id: number): Promise<boolean> {
    const review = this.reviews.get(id);
    if (!review) return false;
    
    const success = this.reviews.delete(id);
    
    // Update the property's rating and review count
    if (success) {
      const property = this.properties.get(review.propertyId);
      if (property) {
        const propertyReviews = await this.getReviews(review.propertyId);
        const totalRating = propertyReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = propertyReviews.length > 0 
          ? totalRating / propertyReviews.length 
          : 0;
        
        this.properties.set(property.id, {
          ...property,
          rating: avgRating,
          reviewCount: propertyReviews.length
        });
      }
    }
    
    return success;
  }
  
  // Neighborhoods
  async getNeighborhoods(cityId: number): Promise<Neighborhood[]> {
    return Array.from(this.neighborhoods.values())
      .filter(neighborhood => neighborhood.cityId === cityId);
  }
  
  async createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const id = this.neighborhoodIdCounter++;
    const newNeighborhood: Neighborhood = { 
      
      ...neighborhood, 
      id,
      cityId: neighborhood.cityId,
      name: neighborhood.name,
      description: neighborhood.description ?? null,
      longDescription: neighborhood.longDescription ?? null,
      latitude: neighborhood.latitude ?? null,  
      longitude: neighborhood.longitude ?? null,
      imageUrl: neighborhood.imageUrl,
      additionalImages: neighborhood.additionalImages ?? [],
      propertyCount: neighborhood.propertyCount ?? 0,
      slug: neighborhood.slug ?? null,
      metaTitle: neighborhood.metaTitle ?? null,
      metaDescription: neighborhood.metaDescription ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.neighborhoods.set(id, newNeighborhood);
    return newNeighborhood;
  }
  
  // Favorites
  async getFavorites(userId: number): Promise<Property[]> {
    const favoriteIds = Array.from(this.favorites.values())
      .filter(fav => fav.userId === userId)
      .map(fav => fav.propertyId);
    
    return Array.from(this.properties.values())
      .filter(property => favoriteIds.includes(property.id));
  }
  
  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteIdCounter++;
    const newFavorite: Favorite = { 
      ...favorite, 
      id, 
      createdAt: new Date() 
    };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }
  
  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const favoriteEntry = Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.propertyId === propertyId
    );
    
    if (!favoriteEntry) return false;
    return this.favorites.delete(favoriteEntry.id);
  }
  
  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      fav => fav.userId === userId && fav.propertyId === propertyId
    );
  }
  
  // Initialize with sample data
  private initializeData() {
    // Create sample cities
    const cities: InsertCity[] = [
      {
        name: "New York",
        country: "United States",
        description: "Experience the energy of the city that never sleeps",
        longDescription: "New York City comprises 5 boroughs sitting where the Hudson River meets the Atlantic Ocean. At its core is Manhattan, a densely populated borough that's among the world's major commercial, financial and cultural centers. Its iconic sites include skyscrapers such as the Empire State Building and sprawling Central Park. Broadway theater is staged in neon-lit Times Square.",
        imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        propertyCount: 1245,
        featured: true
      },
      {
        name: "London",
        country: "United Kingdom",
        description: "Historic landmarks and modern attractions in one vibrant city",
        longDescription: "London, the capital of England and the United Kingdom, is a 21st-century city with history stretching back to Roman times. At its centre stand the imposing Houses of Parliament, the iconic 'Big Ben' clock tower and Westminster Abbey, site of British monarch coronations. Across the Thames River, the London Eye observation wheel provides panoramic views of the South Bank cultural complex, and the entire city.",
        imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        propertyCount: 978,
        featured: true
      },
      {
        name: "Tokyo",
        country: "Japan",
        description: "Ultramodern and traditional blend in Japan's busy capital",
        longDescription: "Tokyo, Japan's busy capital, mixes the ultramodern and the traditional, from neon-lit skyscrapers to historic temples. The opulent Meiji Shinto Shrine is known for its towering gate and surrounding woods. The Imperial Palace sits amid large public gardens. The city's many museums offer exhibits ranging from classical art in the Tokyo National Museum to a reconstructed kabuki theater in the Edo-Tokyo Museum.",
        imageUrl: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        propertyCount: 842,
        featured: true
      },
      {
        name: "Paris",
        country: "France",
        description: "The city of lights, art, and romance",
        longDescription: "Paris, France's capital, is a major European city and a global center for art, fashion, gastronomy and culture. Its 19th-century cityscape is crisscrossed by wide boulevards and the River Seine. Beyond such landmarks as the Eiffel Tower and the 12th-century, Gothic Notre-Dame cathedral, the city is known for its cafe culture and designer boutiques along the Rue du Faubourg Saint-Honoré.",
        imageUrl: "https://images.unsplash.com/photo-1568681731043-805a5720be6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        propertyCount: 1054,
        featured: true
      }
    ];
    
    cities.forEach(city => this.createCity(city));
    
    // Create New York neighborhoods
    const nyc = Array.from(this.cities.values()).find(c => c.name === "New York");
    if (nyc) {
      const neighborhoods: InsertNeighborhood[] = [
        {
          name: "Manhattan",
          cityId: nyc.id,
          description: "The heart of New York City",
          imageUrl: "https://images.unsplash.com/photo-1555109307-f7d9da25c244?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=873&q=80",
          propertyCount: 450
        },
        {
          name: "Brooklyn",
          cityId: nyc.id,
          description: "A diverse borough with a unique vibe",
          imageUrl: "https://images.unsplash.com/photo-1555109307-49fe1e4a4f6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=873&q=80",
          propertyCount: 380
        },
        {
          name: "Queens",
          cityId: nyc.id,
          description: "New York's largest and most diverse borough",
          imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
          propertyCount: 290
        }
      ];
      
      neighborhoods.forEach(hood => this.createNeighborhood(hood));
    }
    
    // Create sample properties
    const properties: InsertProperty[] = [
      {
        name: "Luxury Apartment in Manhattan",
        description: "Welcome to this stunning, modern apartment in the heart of Manhattan's Upper East Side. Recently renovated with designer furnishings and high-end finishes, this spacious two-bedroom offers the perfect luxury retreat in New York City.\n\nThe open concept living area features floor-to-ceiling windows with breathtaking city views, a gourmet kitchen with stainless steel appliances, and a comfortable dining area. Both bedrooms come with premium queen-sized beds and luxurious linens.\n\nLocated just steps from Central Park and Museum Mile, with easy access to subway lines, this apartment offers the perfect base for exploring all that New York has to offer.",
        location: "Upper East Side, Manhattan",
        city: "New York",
        country: "United States",
        price: 189,
        rating: 4.92,
        reviewCount: 128,
        type: "Apartment",
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        additionalImages: [
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=871&q=80",
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
          "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=867&q=80",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
        ],
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        amenities: ["High-speed WiFi", "Air conditioning", "55\" HDTV with Netflix", "Fully equipped kitchen", "Washer/dryer", "Elevator in building", "Gym access", "24/7 security"],
        bedroomDetails: [
          {
            id: 1,
            name: 'Bedroom 1',
            beds: [{ type: 'king', count: 1 }, { type: 'air mattress', count: 1 }],
            image: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
          },
          {
            id: 2,
            name: 'Bedroom 2',
            beds: [{ type: 'queen', count: 1 }, { type: 'single', count: 1 }],
            image: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
          }
        ],
        hostId: 1,
        hostName: "Michael",
        hostImage: "https://randomuser.me/api/portraits/men/32.jpg",
        bookingWidgetUrl: "https://booking.hospitable.com/widget/55ea1cea-3c99-40f7-b98b-3de392f74a36/1080590",
        reviewWidgetCode: "eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=",
        isFeatured: true
      },
      {
        name: "Beach Villa with Ocean View",
        description: "Escape to this stunning beach villa with breathtaking ocean views. Perfect for a relaxing getaway with friends or family.",
        location: "Malibu, CA",
        city: "Malibu",
        country: "United States",
        price: 395,
        rating: 4.97,
        reviewCount: 85,
        type: "Villa",
        imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        additionalImages: [],
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        amenities: ["Private beach access", "Ocean view", "Outdoor BBQ", "WiFi", "Air conditioning", "Fully equipped kitchen"],
        bedroomDetails: [
          {
            id: 1,
            name: 'Master Bedroom',
            beds: [{ type: 'king', count: 1 }],
            image: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3'
          },
          {
            id: 2,
            name: 'Guest Bedroom',
            beds: [{ type: 'queen', count: 1 }, { type: 'single', count: 1 }],
            image: 'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3'
          },
          {
            id: 3,
            name: 'Kids Room',
            beds: [{ type: 'twin', count: 2 }],
            image: 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3'
          }
        ],
        hostId: 2,
        hostName: "Sarah",
        hostImage: "https://randomuser.me/api/portraits/women/45.jpg",
        bookingWidgetUrl: "https://booking.hospitable.com/widget/55ea1cea-3c99-40f7-b98b-3de392f74a36/1080590",
        reviewWidgetCode: "eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=",
        isFeatured: true
      },
      {
        name: "Modern Loft in Downtown",
        description: "Stylish loft in the heart of downtown with exposed brick walls and modern amenities. Perfect for urban explorers.",
        location: "Chicago, IL",
        city: "Chicago",
        country: "United States",
        price: 150,
        rating: 4.85,
        reviewCount: 102,
        type: "Loft",
        imageUrl: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        additionalImages: [],
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 3,
        amenities: ["WiFi", "Smart TV", "Fully equipped kitchen", "Work desk", "Air conditioning", "Washing machine"],
        hostId: 3,
        hostName: "David",
        hostImage: "https://randomuser.me/api/portraits/men/67.jpg",
        bookingWidgetUrl: "https://booking.hospitable.com/widget/55ea1cea-3c99-40f7-b98b-3de392f74a36/1080590",
        reviewWidgetCode: "eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=",
        isFeatured: true
      },
      {
        name: "Cozy Cabin in the Woods",
        description: "Charming cabin surrounded by nature. Ideal for a peaceful retreat with all the comforts of home.",
        location: "Aspen, CO",
        city: "Aspen",
        country: "United States",
        price: 225,
        rating: 4.92,
        reviewCount: 74,
        type: "Cabin",
        imageUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        additionalImages: [],
        bedrooms: 2,
        bathrooms: 1,
        maxGuests: 4,
        amenities: ["Fireplace", "Hot tub", "WiFi", "Fully equipped kitchen", "BBQ grill", "Mountain views"],
        hostId: 4,
        hostName: "Emma",
        hostImage: "https://randomuser.me/api/portraits/women/22.jpg",
        bookingWidgetUrl: "https://booking.hospitable.com/widget/55ea1cea-3c99-40f7-b98b-3de392f74a36/1080590",
        reviewWidgetCode: "eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVjIn0=",
        isFeatured: true
      },
      // More NYC properties for search results
      {
        name: "Modern Studio in SoHo",
        description: "Chic studio in the heart of SoHo. Perfect for couples or solo travelers wanting to experience NYC like a local.",
        location: "SoHo, New York",
        city: "New York",
        country: "United States",
        price: 145,
        rating: 4.88,
        reviewCount: 93,
        type: "Studio",
        imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
        additionalImages: [],
        bedrooms: 0,
        bathrooms: 1,
        maxGuests: 2,
        amenities: ["WiFi", "Smart TV", "Kitchen", "Air conditioning", "Subway access"],
        hostId: 2,
        hostName: "Sarah",
        hostImage: "https://randomuser.me/api/portraits/women/45.jpg",
        bookingWidgetUrl: "https://booking.hospitable.com/widget/55ea1cea-3c99-40f7-b98b-3de392f74a36/1080592",
        reviewWidgetCode: "eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVlIn0=",
        isFeatured: false
      },
      {
        name: "Classic Brooklyn Brownstone",
        description: "Experience Brooklyn living in this charming brownstone apartment with original details and modern comforts.",
        location: "Brooklyn Heights, New York",
        city: "New York",
        country: "United States",
        price: 250,
        rating: 4.95,
        reviewCount: 68,
        type: "Brownstone",
        imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=780&q=80",
        additionalImages: [],
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        amenities: ["WiFi", "Cable TV", "Fully equipped kitchen", "Backyard", "Washer/dryer"],
        hostId: 3,
        hostName: "David",
        hostImage: "https://randomuser.me/api/portraits/men/67.jpg",
        bookingWidgetUrl: "https://booking.hospitable.com/widget/55ea1cea-3c99-40f7-b98b-3de392f74a36/1080593",
        reviewWidgetCode: "eyJwIjoiNjVlMGZiNTg5MjBlYWEwMDYxMjdlNWVmIn0=",
        isFeatured: false
      }
    ];
    
    properties.forEach(property => this.createProperty(property));
    
    // Create sample reviews
    const luxuryApartment = Array.from(this.properties.values()).find(p => p.name === "Luxury Apartment in Manhattan");
    if (luxuryApartment) {
      const reviews: InsertReview[] = [
        {
          propertyId: luxuryApartment.id,
          userId: 5,
          userName: "Sarah",
          userImage: "https://randomuser.me/api/portraits/women/45.jpg",
          rating: 5,
          comment: "This apartment exceeded our expectations! The location is perfect - easy walking distance to Central Park and many great restaurants. The space is beautifully decorated and the views are amazing. Michael was an excellent host, very responsive and helpful."
        },
        {
          propertyId: luxuryApartment.id,
          userId: 6,
          userName: "David",
          userImage: "https://randomuser.me/api/portraits/men/67.jpg",
          rating: 4.8,
          comment: "Clean, comfortable, and luxurious! The apartment looks exactly like the photos. The kitchen had everything we needed, and the beds were extremely comfortable. The location is unbeatable for exploring Manhattan. Highly recommend!"
        },
        {
          propertyId: luxuryApartment.id,
          userId: 7,
          userName: "Emma",
          userImage: "https://randomuser.me/api/portraits/women/22.jpg",
          rating: 5,
          comment: "Perfect NYC experience! The apartment is stylish and spacious, especially by New York standards. Great natural light, comfortable furniture, and all the amenities you could want. Michael was very accommodating with our check-in. Will definitely stay here again on our next visit."
        }
      ];
      
      reviews.forEach(review => this.createReview(review));
    }
    
    // Create sample user
    this.createUser({
      username: "testuser",
      password: "password123"
    });
  }
}

function normalizeBedroomDetails(details: any): { id: number; name: string; beds: { type: string; count: number }[]; image: string }[] {
  return Object.values(details).map((detail: any) => ({
    id: detail.id,
    name: detail.name,
    image: detail.image || "",
    beds: Object.values(detail.beds)
  }));
}


// // Import the database storage implementation
// import { DatabaseStorage } from "./database-storage";

// // Choose the storage implementation to use
// const useDatabase = process.env.DATABASE_URL ? true : false;

// // Export the database storage implementation
// export const storage = new DatabaseStorage();

// console.log(`Using ${useDatabase ? 'database' : 'memory'} storage`);
