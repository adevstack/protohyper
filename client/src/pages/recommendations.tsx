import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyModal } from "@/components/PropertyModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Search, Filter, Grid, List, Users, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authRequest } from "@/lib/auth";
import type { PropertyWithOwner } from "@shared/schema";

export default function Recommendations() {
  const { user } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [filterType, setFilterType] = useState("");

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['/api/v1/recommendations'],
    queryFn: async () => {
      const response = await authRequest('GET', '/api/v1/recommendations');
      return response.json();
    },
    enabled: !!user,
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['/api/v1/favorites'],
    queryFn: async () => {
      const response = await authRequest('GET', '/api/v1/favorites');
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const favoritePropertyIds = new Set(favoritesData?.map((p: PropertyWithOwner) => p.id) || []);

  // Filter and sort recommendations
  const filteredRecommendations = recommendations ? recommendations.filter((property: PropertyWithOwner) => {
    const matchesSearch = !searchTerm || 
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.state.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || property.type === filterType;
    
    return matchesSearch && matchesType;
  }).sort((a: PropertyWithOwner, b: PropertyWithOwner) => {
    switch (sortBy) {
      case 'price_asc':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price_desc':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  }) : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
              <p className="text-gray-600">Please login to view your property recommendations.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <MessageSquare className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Recommended Properties</h1>
          </div>
          <p className="text-gray-600">
            Properties that have been recommended to you by friends and family.
            {recommendations && ` ${recommendations.length} recommendations received.`}
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Users className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">How recommendations work</h3>
                <p className="text-blue-800 mb-3">
                  When someone finds a property they think you'd love, they can recommend it to you using your email address. 
                  These recommendations will appear here for you to browse and consider.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Recommendations are sorted by date received</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>You can also recommend properties to others</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search recommendations by title, city, or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Townhouse">Townhouse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="title_asc">Title: A to Z</SelectItem>
                  <SelectItem value="title_desc">Title: Z to A</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Grid className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Clear filters */}
            {(searchTerm || filterType || sortBy) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("");
                    setSortBy("");
                  }}
                  className="text-sm"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLoading ? 'Loading...' : `${filteredRecommendations.length} recommended properties`}
          </h2>
        </div>

        {/* Recommendations Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
                  <div className="flex space-x-4 mb-4">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendations.map((property: PropertyWithOwner) => (
              <div key={property.id} className="relative">
                <PropertyCard
                  property={property}
                  onViewDetails={setSelectedProperty}
                  isFavorited={favoritePropertyIds.has(property.id)}
                />
                {/* Recommendation Badge */}
                <div className="absolute top-2 left-2">
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Recommended
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              {searchTerm || filterType ? (
                <>
                  <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search or filters to find the properties you're looking for.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("");
                      setSortBy("");
                    }}
                  >
                    Clear filters
                  </Button>
                </>
              ) : (
                <>
                  <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't received any property recommendations yet. 
                    Share your email with friends and family so they can recommend properties to you!
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-6 text-left max-w-md mx-auto">
                    <h4 className="font-medium text-gray-900 mb-2">Your email for recommendations:</h4>
                    <p className="text-sm text-gray-600 font-mono bg-white px-3 py-2 rounded border">
                      {user.email}
                    </p>
                  </div>
                  <Button onClick={() => window.location.href = '/'} className="mt-6">
                    Browse Properties
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* How to recommend section */}
        {recommendations && recommendations.length > 0 && (
          <Card className="mt-12">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Want to recommend a property to someone?
              </h3>
              <p className="text-gray-600 mb-4">
                When viewing any property, you can use the "Recommend" button to share it with friends and family via their email address.
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Browse Properties to Recommend
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Property Detail Modal */}
      <PropertyModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        isFavorited={selectedProperty ? favoritePropertyIds.has(selectedProperty.id) : false}
      />
    </div>
  );
}
