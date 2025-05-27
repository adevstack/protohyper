import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Bed, Bath, Maximize, Star } from "lucide-react";
import { authRequest } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { PropertyWithOwner } from "@shared/schema";

interface PropertyCardProps {
  property: PropertyWithOwner;
  onViewDetails: (property: PropertyWithOwner) => void;
  isFavorited?: boolean;
}

export function PropertyCard({ property, onViewDetails, isFavorited = false }: PropertyCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [favorited, setFavorited] = useState(isFavorited);

  const favoriteMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      const method = action === 'add' ? 'POST' : 'DELETE';
      await authRequest(method, `/api/v1/favorites/${property.id}`);
    },
    onSuccess: (_, action) => {
      setFavorited(action === 'add');
      queryClient.invalidateQueries({ queryKey: ['/api/v1/favorites'] });
      toast({
        description: action === 'add' ? 'Added to favorites' : 'Removed from favorites',
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    },
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save favorites",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate(favorited ? 'remove' : 'add');
  };

  const getImageUrl = () => {
    if (property.imageUrl) return property.imageUrl;
    
    // Fallback images based on property type
    const fallbackImages = {
      'House': 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      'Apartment': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      'Condo': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      'Villa': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
      'Townhouse': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
    };
    
    return fallbackImages[property.type as keyof typeof fallbackImages] || fallbackImages.House;
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return property.listingType === 'Rent' || property.listingType === 'Lease' 
      ? `$${num.toLocaleString()}/mo`
      : `$${num.toLocaleString()}`;
  };

  const getListingBadgeColor = (listingType: string) => {
    switch (listingType) {
      case 'Sale': return 'bg-primary text-primary-foreground';
      case 'Rent': return 'bg-secondary text-secondary-foreground';
      case 'Lease': return 'bg-warning text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
      <div className="relative" onClick={() => onViewDetails(property)}>
        <img
          src={getImageUrl()}
          alt={property.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
          }}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {property.isVerified && (
            <Badge className="bg-success text-white">
              Verified
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-md"
            onClick={toggleFavorite}
            disabled={favoriteMutation.isPending}
          >
            <Heart 
              className={`h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
            />
          </Button>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge className={getListingBadgeColor(property.listingType)}>
            For {property.listingType}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-5" onClick={() => onViewDetails(property)}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {property.title}
          </h3>
          <span className="text-xl font-bold text-primary whitespace-nowrap ml-2">
            {formatPrice(property.price)}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 flex items-center">
          <MapPin className="h-4 w-4 mr-1" />
          {property.city}, {property.state}
        </p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            {property.bedrooms} Beds
          </span>
          <span className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            {property.bathrooms} Baths
          </span>
          <span className="flex items-center">
            <Maximize className="h-4 w-4 mr-1" />
            {property.areaSqFt.toLocaleString()} sq ft
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(parseFloat(property.rating || "0"))
                      ? "fill-current"
                      : ""
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {parseFloat(property.rating || "0").toFixed(1)}
            </span>
          </div>
          <Button
            variant="link"
            className="text-primary hover:text-indigo-700 p-0 h-auto font-medium text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(property);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
