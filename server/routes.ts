import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, type PropertyFilters } from "@shared/schema";
import { generateToken, verifyToken } from "./services/auth.service";

interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

// Middleware to verify JWT token
const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/v1/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = generateToken(user.id, user.email);
      
      res.status(201).json({ 
        user: { id: user.id, name: user.name, email: user.email }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid user data', error });
    }
  });

  app.post('/api/v1/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.id, user.email);
      
      res.json({ 
        user: { id: user.id, name: user.name, email: user.email }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: 'Login failed', error });
    }
  });

  // Property routes
  app.get('/api/v1/properties', async (req, res) => {
    try {
      const filters: PropertyFilters = {
        priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
        priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
        areaMin: req.query.areaMin ? Number(req.query.areaMin) : undefined,
        areaMax: req.query.areaMax ? Number(req.query.areaMax) : undefined,
        bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
        bathrooms: req.query.bathrooms ? Number(req.query.bathrooms) : undefined,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
        type: req.query.type as string,
        furnished: req.query.furnished as string,
        listingType: req.query.listingType as string,
        isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
        amenities: req.query.amenities as string,
        tags: req.query.tags as string,
        availableFromBefore: req.query.availableFromBefore as string,
        availableFromAfter: req.query.availableFromAfter as string,
        sort: req.query.sort as PropertyFilters['sort'],
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 12,
      };

      const result = await storage.getProperties(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch properties', error });
    }
  });

  app.get('/api/v1/properties/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch property', error });
    }
  });

  app.post('/api/v1/properties', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(propertyData, req.user!.id);
      
      res.status(201).json(property);
    } catch (error) {
      res.status(400).json({ message: 'Invalid property data', error });
    }
  });

  app.patch('/api/v1/properties/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const updateData = req.body;
      
      const property = await storage.updateProperty(id, updateData, req.user!.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found or unauthorized' });
      }
      
      res.json(property);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update property', error });
    }
  });

  app.delete('/api/v1/properties/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteProperty(id, req.user!.id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Property not found or unauthorized' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete property', error });
    }
  });

  // Favorites routes
  app.post('/api/v1/favorites/:propertyId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const propertyId = Number(req.params.propertyId);
      const favorite = await storage.addFavorite(req.user!.id, propertyId);
      
      res.status(201).json(favorite);
    } catch (error) {
      res.status(400).json({ message: 'Failed to add favorite', error });
    }
  });

  app.delete('/api/v1/favorites/:propertyId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const propertyId = Number(req.params.propertyId);
      const removed = await storage.removeFavorite(req.user!.id, propertyId);
      
      if (!removed) {
        return res.status(404).json({ message: 'Favorite not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove favorite', error });
    }
  });

  app.get('/api/v1/favorites', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch favorites', error });
    }
  });

  // Recommendations routes
  app.post('/api/v1/recommend', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { recipientEmail, propertyId } = req.body;
      
      const recommendation = await storage.createRecommendation(
        req.user!.id,
        recipientEmail,
        Number(propertyId)
      );
      
      if (!recommendation) {
        return res.status(400).json({ message: 'Failed to create recommendation. User or property not found.' });
      }
      
      res.status(201).json(recommendation);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create recommendation', error });
    }
  });

  app.get('/api/v1/recommendations', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const recommendations = await storage.getUserRecommendations(req.user!.id);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch recommendations', error });
    }
  });

  // Get current user
  app.get('/api/v1/auth/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user', error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
