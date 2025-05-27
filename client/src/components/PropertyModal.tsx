import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Share, MapPin, Bed, Bath, Maximize, Star, X, Check } from "lucide-react";
import { authRequest } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { PropertyWithOwner } from "@shared/schema";

interface PropertyModalProps {
  property: PropertyWithOwner | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorited?: boolean;
}

export function PropertyModal({ property, isOpen, onClose, isFavorited = false }: PropertyModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [favorited, setFavorited] = useState(isFavorited);
  const [recommendEmail, setRecommendEmail] = useState("");
  const [showRecommendForm, setShowRecommendForm] = useState(false);

  const favoriteMutation = useMutation({
    mutationFn: async (action: 'add' | 'remove') => {
      const method = action === 'add' ? 'POST' : 'DELETE';
      await authRequest(method, `/api/v1/favorites/${property!.id}`);
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

  const recommendMutation = useMutation({
    mutationFn: async () => {
      await authRequest('POST', '/api/v1/recommend', {
        recipientEmail: recommendEmail,
        propertyId: property!.id,
      });
    },
    onSuccess: () => {
      toast({
        description: `Property recommended to ${recommendEmail}`,
      });
      setRecommendEmail("");
      setShowRecommendForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send recommendation",
        variant: "destructive",
      });
    },
  });

  if (!property) return null;

  const toggleFavorite = () => {
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

  const handleRecommend = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to recommend properties",
        variant: "destructive",
      });
      return;
    }
    
    if (showRecommendForm && recommendEmail) {
      recommendMutation.mutate();
    } else {
      setShowRecommendForm(true);
    }
  };

  const getImageUrl = () => {
    if (property.imageUrl) return property.imageUrl;
    
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

  const getAmenities = () => {
    if (!property.amenities) return [];
    return property.amenities.split('|').filter(Boolean);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{property.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property Images */}
          <div className="space-y-4">
            <img
              src={getImageUrl()}
              alt={property.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              <img
                src="https://images.unsplash.com/photo-1556912173-46c336c7fd55?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                alt="Kitchen view"
                className="w-full h-20 object-cover rounded-lg cursor-pointer"
              />
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                alt="Bedroom view"
                className="w-full h-20 object-cover rounded-lg cursor-pointer"
              />
              <img
                src="https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                alt="Bathroom view"
                className="w-full h-20 object-cover rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(property.price)}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={toggleFavorite}
                    disabled={favoriteMutation.isPending}
                  >
                    <Heart 
                      className={`mr-2 h-4 w-4 ${favorited ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                    Save
                  </Button>
                  {showRecommendForm ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Enter email"
                        value={recommendEmail}
                        onChange={(e) => setRecommendEmail(e.target.value)}
                        className="w-32"
                      />
                      <Button 
                        size="sm"
                        onClick={handleRecommend}
                        disabled={!recommendEmail || recommendMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setShowRecommendForm(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={handleRecommend}>
                      <Share className="mr-2 h-4 w-4" />
                      Recommend
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-gray-600 mb-4 flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                {property.city}, {property.state}, {property.country}
              </p>
              {property.isVerified && (
                <Badge className="bg-success text-white mb-4">
                  Verified Property
                </Badge>
              )}
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bed className="text-primary h-5 w-5" />
                  <span className="font-medium">{property.bedrooms} Bedrooms</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bath className="text-primary h-5 w-5" />
                  <span className="font-medium">{property.bathrooms} Bathrooms</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Maximize className="text-primary h-5 w-5" />
                  <span className="font-medium">{property.areaSqFt.toLocaleString()} sq ft</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Star className="text-yellow-400 h-5 w-5" />
                  <span className="font-medium">{parseFloat(property.rating || "0").toFixed(1)} Rating</span>
                </div>
              </div>
            </div>

            {/* Property Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {property.type}
              </div>
              <div>
                <span className="font-medium">Furnished:</span> {property.furnished}
              </div>
              <div>
                <span className="font-medium">Listed by:</span> {property.listedBy}
              </div>
              <div>
                <span className="font-medium">Listing Type:</span> {property.listingType}
              </div>
            </div>

            {/* Property Description */}
            {property.description && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                <p className="text-gray-600 leading-relaxed">
                  {property.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {getAmenities().length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  {getAmenities().map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="text-success mr-2 h-4 w-4" />
                      {amenity.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <Button className="flex-1">
                Contact Owner
              </Button>
              <Button variant="outline" className="flex-1">
                Schedule Tour
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
