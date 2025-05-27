import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { type User, type InsertUser, type Property, type InsertProperty, type PropertyWithOwner, type Favorite, type InsertFavorite, type Recommendation, type InsertRecommendation, type PropertyFilters } from "@shared/schema";
import { IStorage } from './storage';

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private users: Collection;
  private properties: Collection;
  private favorites: Collection;
  private recommendations: Collection;
  private currentId: number = 1;

  constructor() {
    const connectionString = process.env.MONGODB_URL;
    if (!connectionString) {
      throw new Error("MONGODB_URL environment variable is required");
    }
    this.client = new MongoClient(connectionString);
    this.db = this.client.db("property_db");
    this.users = this.db.collection("users");
    this.properties = this.db.collection("properties");
    this.favorites = this.db.collection("favorites");
    this.recommendations = this.db.collection("recommendations");
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB successfully");
      
      // Initialize counter for IDs
      const lastProperty = await this.properties.findOne({}, { sort: { id: -1 } });
      const lastUser = await this.users.findOne({}, { sort: { id: -1 } });
      const lastFavorite = await this.favorites.findOne({}, { sort: { id: -1 } });
      const lastRecommendation = await this.recommendations.findOne({}, { sort: { id: -1 } });
      
      this.currentId = Math.max(
        lastProperty?.id || 0,
        lastUser?.id || 0,
        lastFavorite?.id || 0,
        lastRecommendation?.id || 0
      ) + 1;
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await this.users.findOne({ id });
    return user ? this.mapUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.users.findOne({ email });
    return user ? this.mapUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.currentId++;
    const now = new Date();
    
    const user = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    };

    await this.users.insertOne(user);
    return this.mapUser(user);
  }

  // Property methods
  async getProperty(id: number): Promise<PropertyWithOwner | undefined> {
    const property = await this.properties.findOne({ id });
    if (!property) return undefined;

    const owner = await this.users.findOne({ id: property.createdBy });
    if (!owner) return undefined;

    return {
      ...this.mapProperty(property),
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
      },
    };
  }

  async getProperties(filters: PropertyFilters): Promise<{ properties: PropertyWithOwner[]; total: number; page: number; totalPages: number }> {
    const query: any = {};
    
    // Apply filters
    if (filters.priceMin !== undefined) query.price = { ...query.price, $gte: filters.priceMin };
    if (filters.priceMax !== undefined) query.price = { ...query.price, $lte: filters.priceMax };
    if (filters.areaMin !== undefined) query.areaSqFt = { ...query.areaSqFt, $gte: filters.areaMin };
    if (filters.areaMax !== undefined) query.areaSqFt = { ...query.areaSqFt, $lte: filters.areaMax };
    if (filters.bedrooms !== undefined) query.bedrooms = { $gte: filters.bedrooms };
    if (filters.bathrooms !== undefined) query.bathrooms = { $gte: filters.bathrooms };
    if (filters.city && filters.city !== 'all') query.city = new RegExp(filters.city, 'i');
    if (filters.state && filters.state !== 'all') query.state = new RegExp(filters.state, 'i');
    if (filters.country && filters.country !== 'all') query.country = new RegExp(filters.country, 'i');
    if (filters.type && filters.type !== 'all') query.type = filters.type;
    if (filters.furnished && filters.furnished !== 'any') query.furnished = filters.furnished;
    if (filters.listingType && filters.listingType !== 'all') query.listingType = filters.listingType;
    if (filters.isVerified !== undefined && filters.isVerified !== 'all') query.isVerified = filters.isVerified === true || filters.isVerified === 'true';
    if (filters.amenities) query.amenities = new RegExp(filters.amenities, 'i');
    if (filters.tags) query.tags = new RegExp(filters.tags, 'i');

    // Date filtering
    if (filters.availableFromBefore) {
      query.availableFrom = { ...query.availableFrom, $lte: new Date(filters.availableFromBefore) };
    }
    if (filters.availableFromAfter) {
      query.availableFrom = { ...query.availableFrom, $gte: new Date(filters.availableFromAfter) };
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Sorting
    let sort: any = { createdAt: -1 }; // Default sort
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          sort = { price: 1 };
          break;
        case 'price_desc':
          sort = { price: -1 };
          break;
        case 'created_asc':
          sort = { createdAt: 1 };
          break;
        case 'created_desc':
          sort = { createdAt: -1 };
          break;
      }
    }

    const total = await this.properties.countDocuments(query);
    const propertyDocs = await this.properties.find(query).sort(sort).skip(skip).limit(limit).toArray();

    // Get owner information for each property
    const properties: PropertyWithOwner[] = [];
    for (const propertyDoc of propertyDocs) {
      const owner = await this.users.findOne({ id: propertyDoc.createdBy });
      if (owner) {
        properties.push({
          ...this.mapProperty(propertyDoc),
          owner: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
          },
        });
      }
    }

    return {
      properties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createProperty(insertProperty: InsertProperty, createdBy: number): Promise<Property> {
    const id = this.currentId++;
    const now = new Date();
    
    const property = {
      ...insertProperty,
      id,
      createdBy,
      createdAt: now,
      updatedAt: now,
      isVerified: insertProperty.isVerified || false,
      description: insertProperty.description || null,
      amenities: insertProperty.amenities || null,
      tags: insertProperty.tags || null,
      rating: insertProperty.rating || null,
      imageUrl: insertProperty.imageUrl || null,
      availableFrom: insertProperty.availableFrom || null,
      listedBy: insertProperty.listedBy || "Owner",
    };

    await this.properties.insertOne(property);
    return this.mapProperty(property);
  }

  async updateProperty(id: number, updateProperty: Partial<InsertProperty>, userId: number): Promise<Property | null> {
    const existingProperty = await this.properties.findOne({ id, createdBy: userId });
    if (!existingProperty) return null;

    const updatedProperty = {
      ...existingProperty,
      ...updateProperty,
      updatedAt: new Date(),
    };

    await this.properties.updateOne({ id }, { $set: updatedProperty });
    return this.mapProperty(updatedProperty);
  }

  async deleteProperty(id: number, userId: number): Promise<boolean> {
    const result = await this.properties.deleteOne({ id, createdBy: userId });
    return result.deletedCount > 0;
  }

  // Favorite methods
  async addFavorite(userId: number, propertyId: number): Promise<Favorite> {
    const id = this.currentId++;
    const now = new Date();
    
    const favorite = {
      id,
      userId,
      propertyId,
      createdAt: now,
    };

    await this.favorites.insertOne(favorite);
    return this.mapFavorite(favorite);
  }

  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const result = await this.favorites.deleteOne({ userId, propertyId });
    return result.deletedCount > 0;
  }

  async getUserFavorites(userId: number): Promise<PropertyWithOwner[]> {
    const favoritesDocs = await this.favorites.find({ userId }).toArray();
    const propertyIds = favoritesDocs.map(f => f.propertyId);
    
    const properties: PropertyWithOwner[] = [];
    for (const propertyId of propertyIds) {
      const property = await this.getProperty(propertyId);
      if (property) {
        properties.push(property);
      }
    }
    
    return properties;
  }

  // Recommendation methods
  async createRecommendation(fromUserId: number, toUserEmail: string, propertyId: number): Promise<Recommendation | null> {
    const toUser = await this.getUserByEmail(toUserEmail);
    if (!toUser) return null;

    const id = this.currentId++;
    const now = new Date();
    
    const recommendation = {
      id,
      fromUserId,
      toUserId: toUser.id,
      propertyId,
      createdAt: now,
    };

    await this.recommendations.insertOne(recommendation);
    return this.mapRecommendation(recommendation);
  }

  async getUserRecommendations(userId: number): Promise<PropertyWithOwner[]> {
    const recommendationsDocs = await this.recommendations.find({ toUserId: userId }).toArray();
    const propertyIds = recommendationsDocs.map(r => r.propertyId);
    
    const properties: PropertyWithOwner[] = [];
    for (const propertyId of propertyIds) {
      const property = await this.getProperty(propertyId);
      if (property) {
        properties.push(property);
      }
    }
    
    return properties;
  }

  // Helper mapping methods
  private mapUser(doc: any): User {
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      password: doc.password,
      createdAt: doc.createdAt,
    };
  }

  private mapProperty(doc: any): Property {
    return {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      bedrooms: doc.bedrooms,
      bathrooms: doc.bathrooms,
      areaSqFt: doc.areaSqFt,
      price: doc.price,
      city: doc.city,
      state: doc.state,
      country: doc.country,
      furnished: doc.furnished,
      listingType: doc.listingType,
      isVerified: doc.isVerified,
      listedBy: doc.listedBy || "Owner",
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      description: doc.description,
      amenities: doc.amenities,
      tags: doc.tags,
      rating: doc.rating,
      imageUrl: doc.imageUrl,
      availableFrom: doc.availableFrom,
    };
  }

  private mapFavorite(doc: any): Favorite {
    return {
      id: doc.id,
      userId: doc.userId,
      propertyId: doc.propertyId,
      createdAt: doc.createdAt,
    };
  }

  private mapRecommendation(doc: any): Recommendation {
    return {
      id: doc.id,
      fromUserId: doc.fromUserId,
      toUserId: doc.toUserId,
      propertyId: doc.propertyId,
      createdAt: doc.createdAt,
    };
  }

  async close() {
    await this.client.close();
  }
}

export const mongoStorage = new MongoStorage();