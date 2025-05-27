import { users, properties, favorites, recommendations, type User, type InsertUser, type Property, type InsertProperty, type PropertyWithOwner, type Favorite, type InsertFavorite, type Recommendation, type InsertRecommendation, type PropertyFilters } from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property methods
  getProperty(id: number): Promise<PropertyWithOwner | undefined>;
  getProperties(filters: PropertyFilters): Promise<{ properties: PropertyWithOwner[]; total: number; page: number; totalPages: number }>;
  createProperty(property: InsertProperty, createdBy: number): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>, userId: number): Promise<Property | null>;
  deleteProperty(id: number, userId: number): Promise<boolean>;
  
  // Favorite methods
  addFavorite(userId: number, propertyId: number): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;
  getUserFavorites(userId: number): Promise<PropertyWithOwner[]>;
  
  // Recommendation methods
  createRecommendation(fromUserId: number, toUserEmail: string, propertyId: number): Promise<Recommendation | null>;
  getUserRecommendations(userId: number): Promise<PropertyWithOwner[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private favorites: Map<number, Favorite>;
  private recommendations: Map<number, Recommendation>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.favorites = new Map();
    this.recommendations = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getProperty(id: number): Promise<PropertyWithOwner | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    
    const owner = this.users.get(property.createdBy);
    if (!owner) return undefined;
    
    return {
      ...property,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
      },
    };
  }

  async getProperties(filters: PropertyFilters): Promise<{ properties: PropertyWithOwner[]; total: number; page: number; totalPages: number }> {
    let filteredProperties = Array.from(this.properties.values());

    // Apply filters
    if (filters.priceMin !== undefined) {
      filteredProperties = filteredProperties.filter(p => parseFloat(p.price) >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filteredProperties = filteredProperties.filter(p => parseFloat(p.price) <= filters.priceMax!);
    }
    if (filters.areaMin !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.areaSqFt >= filters.areaMin!);
    }
    if (filters.areaMax !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.areaSqFt <= filters.areaMax!);
    }
    if (filters.bedrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.bedrooms >= filters.bedrooms!);
    }
    if (filters.bathrooms !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.bathrooms >= filters.bathrooms!);
    }
    if (filters.city) {
      filteredProperties = filteredProperties.filter(p => 
        p.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters.state) {
      filteredProperties = filteredProperties.filter(p => 
        p.state.toLowerCase().includes(filters.state!.toLowerCase())
      );
    }
    if (filters.country) {
      filteredProperties = filteredProperties.filter(p => 
        p.country.toLowerCase().includes(filters.country!.toLowerCase())
      );
    }
    if (filters.type) {
      filteredProperties = filteredProperties.filter(p => p.type === filters.type);
    }
    if (filters.furnished) {
      filteredProperties = filteredProperties.filter(p => p.furnished === filters.furnished);
    }
    if (filters.listingType) {
      filteredProperties = filteredProperties.filter(p => p.listingType === filters.listingType);
    }
    if (filters.isVerified !== undefined) {
      filteredProperties = filteredProperties.filter(p => p.isVerified === filters.isVerified);
    }
    if (filters.amenities) {
      filteredProperties = filteredProperties.filter(p => 
        p.amenities?.toLowerCase().includes(filters.amenities!.toLowerCase())
      );
    }
    if (filters.tags) {
      filteredProperties = filteredProperties.filter(p => 
        p.tags?.toLowerCase().includes(filters.tags!.toLowerCase())
      );
    }
    if (filters.availableFromBefore) {
      const beforeDate = new Date(filters.availableFromBefore);
      filteredProperties = filteredProperties.filter(p => 
        p.availableFrom && new Date(p.availableFrom) <= beforeDate
      );
    }
    if (filters.availableFromAfter) {
      const afterDate = new Date(filters.availableFromAfter);
      filteredProperties = filteredProperties.filter(p => 
        p.availableFrom && new Date(p.availableFrom) >= afterDate
      );
    }

    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          filteredProperties.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price_desc':
          filteredProperties.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'created_asc':
          filteredProperties.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'created_desc':
          filteredProperties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    } else {
      // Default sort by newest first
      filteredProperties.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = filteredProperties.length;
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    // Add owner information
    const propertiesWithOwners: PropertyWithOwner[] = paginatedProperties
      .map(property => {
        const owner = this.users.get(property.createdBy);
        if (!owner) return null;
        return {
          ...property,
          owner: {
            id: owner.id,
            name: owner.name,
            email: owner.email,
          },
        };
      })
      .filter((p): p is PropertyWithOwner => p !== null);

    return {
      properties: propertiesWithOwners,
      total,
      page,
      totalPages,
    };
  }

  async createProperty(insertProperty: InsertProperty, createdBy: number): Promise<Property> {
    const id = this.currentId++;
    const now = new Date();
    const property: Property = {
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
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, updateProperty: Partial<InsertProperty>, userId: number): Promise<Property | null> {
    const property = this.properties.get(id);
    if (!property || property.createdBy !== userId) {
      return null;
    }
    
    const updatedProperty: Property = {
      ...property,
      ...updateProperty,
      updatedAt: new Date(),
    };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number, userId: number): Promise<boolean> {
    const property = this.properties.get(id);
    if (!property || property.createdBy !== userId) {
      return false;
    }
    
    // Remove associated favorites and recommendations
    Array.from(this.favorites.entries()).forEach(([favId, fav]) => {
      if (fav.propertyId === id) {
        this.favorites.delete(favId);
      }
    });
    
    Array.from(this.recommendations.entries()).forEach(([recId, rec]) => {
      if (rec.propertyId === id) {
        this.recommendations.delete(recId);
      }
    });
    
    return this.properties.delete(id);
  }

  async addFavorite(userId: number, propertyId: number): Promise<Favorite> {
    // Check if already favorited
    const existing = Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.propertyId === propertyId
    );
    if (existing) return existing;
    
    const id = this.currentId++;
    const favorite: Favorite = {
      id,
      userId,
      propertyId,
      createdAt: new Date(),
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const favoriteEntry = Array.from(this.favorites.entries()).find(
      ([, fav]) => fav.userId === userId && fav.propertyId === propertyId
    );
    if (!favoriteEntry) return false;
    
    return this.favorites.delete(favoriteEntry[0]);
  }

  async getUserFavorites(userId: number): Promise<PropertyWithOwner[]> {
    const userFavorites = Array.from(this.favorites.values()).filter(fav => fav.userId === userId);
    const favoriteProperties: PropertyWithOwner[] = [];
    
    for (const favorite of userFavorites) {
      const propertyWithOwner = await this.getProperty(favorite.propertyId);
      if (propertyWithOwner) {
        favoriteProperties.push(propertyWithOwner);
      }
    }
    
    return favoriteProperties;
  }

  async createRecommendation(fromUserId: number, toUserEmail: string, propertyId: number): Promise<Recommendation | null> {
    const toUser = await this.getUserByEmail(toUserEmail);
    if (!toUser) return null;
    
    // Check if property exists
    const property = this.properties.get(propertyId);
    if (!property) return null;
    
    const id = this.currentId++;
    const recommendation: Recommendation = {
      id,
      fromUserId,
      toUserId: toUser.id,
      propertyId,
      createdAt: new Date(),
    };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }

  async getUserRecommendations(userId: number): Promise<PropertyWithOwner[]> {
    const userRecommendations = Array.from(this.recommendations.values()).filter(rec => rec.toUserId === userId);
    const recommendedProperties: PropertyWithOwner[] = [];
    
    for (const recommendation of userRecommendations) {
      const propertyWithOwner = await this.getProperty(recommendation.propertyId);
      if (propertyWithOwner) {
        recommendedProperties.push(propertyWithOwner);
      }
    }
    
    return recommendedProperties;
  }
}

import { mongoStorage } from './mongoStorage';

export const storage = mongoStorage;
