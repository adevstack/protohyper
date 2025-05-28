import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { PropertyFilters } from "@/components/PropertyFilters";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyModal } from "@/components/PropertyModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Grid, List, Search, MapPin, DollarSign } from "lucide-react";
import type { PropertyWithOwner, PropertyFilters as PropertyFiltersType } from "@shared/schema";

export default function Home() {
  const [filters, setFilters] = useState<PropertyFiltersType>({});
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [quickSearch, setQuickSearch] = useState({
    location: "",
    type: "",
    priceRange: "",
  });

  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['/api/v1/properties', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/v1/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['/api/v1/favorites'],
    queryFn: async () => {
      const response = await fetch('/api/v1/favorites', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch favorites');
      }
      return response.json();
    },
    retry: false,
  });

  const favoritePropertyIds = new Set(favoritesData?.map((p: PropertyWithOwner) => p.id) || []);

  const handleQuickSearch = () => {
    const newFilters: PropertyFiltersType = {};
    
    if (quickSearch.location) {
      // Search in both city and state
      newFilters.city = quickSearch.location;
      newFilters.state = quickSearch.location;
    }
    
    if (quickSearch.type && quickSearch.type.trim() !== '') {
      newFilters.type = quickSearch.type;
    }
    
    if (quickSearch.priceRange) {
      const [min, max] = quickSearch.priceRange.split('-').map(Number);
      if (min) newFilters.priceMin = min;
      if (max) newFilters.priceMax = max;
    }
    
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="gradient-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Find Your Perfect Home
            </h1>
            <p className="text-xl sm:text-2xl mb-8 text-indigo-100">
              Discover premium properties with advanced search and personalized recommendations
            </p>
            
            {/* Quick Search Bar */}
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Input
                    placeholder="City or State"
                    value={quickSearch.location}
                    onChange={(e) => setQuickSearch(prev => ({ ...prev, location: e.target.value }))}
                    className="text-gray-900"
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
                <Select
                  value={quickSearch.type}
                  onValueChange={(value) => setQuickSearch(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Condo">Condo</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Input
                    placeholder="Price Range"
                    value={quickSearch.priceRange}
                    onChange={(e) => setQuickSearch(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="text-gray-900"
                  />
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
                <Button onClick={handleQuickSearch} className="bg-primary hover:bg-indigo-700">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filters */}
        <PropertyFilters
          onFiltersChange={setFilters}
          initialFilters={filters}
        />

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Properties</h2>
            <p className="text-gray-600 mt-1">
              {isLoading ? 'Loading...' : `${propertiesData?.total || 0} properties found`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Property Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {propertiesData?.properties?.map((property: PropertyWithOwner) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={setSelectedProperty}
                isFavorited={favoritePropertyIds.has(property.id)}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && (!propertiesData?.properties || propertiesData.properties.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600">Try adjusting your search filters to see more results.</p>
          </div>
        )}

        {/* Pagination */}
        {propertiesData && propertiesData.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, (propertiesData.page || 1) - 1))}
                    className={propertiesData.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(5, propertiesData.totalPages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === propertiesData.page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(propertiesData.totalPages, (propertiesData.page || 1) + 1))}
                    className={propertiesData.page >= propertiesData.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      {/* Property Detail Modal */}
      <PropertyModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
        isFavorited={selectedProperty ? favoritePropertyIds.has(selectedProperty.id) : false}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">protoHyper</h3>
              <p className="text-gray-300 mb-4">
                Your trusted partner in finding the perfect property. Advanced search, personalized recommendations, and professional service.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Properties</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Houses for Sale</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Apartments</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Condos</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Commercial</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Property Management</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Real Estate Consulting</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Market Analysis</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Investment Advice</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 protoHyper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
