import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PropertyFilters as PropertyFiltersType } from "@shared/schema";

const filtersSchema = z.object({
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  areaMin: z.string().optional(),
  areaMax: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  type: z.string().optional(),
  furnished: z.string().optional(),
  listingType: z.string().optional(),
  isVerified: z.string().optional(),
  amenities: z.string().optional(),
  availableFrom: z.string().optional(),
  sort: z.string().optional(),
});

type FiltersFormData = z.infer<typeof filtersSchema>;

interface PropertyFiltersProps {
  onFiltersChange: (filters: PropertyFiltersType) => void;
  initialFilters?: Partial<PropertyFiltersType>;
}

export function PropertyFilters({ onFiltersChange, initialFilters = {} }: PropertyFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const form = useForm<FiltersFormData>({
    resolver: zodResolver(filtersSchema),
    defaultValues: {
      priceMin: initialFilters.priceMin?.toString() || "",
      priceMax: initialFilters.priceMax?.toString() || "",
      areaMin: initialFilters.areaMin?.toString() || "",
      areaMax: initialFilters.areaMax?.toString() || "",
      bedrooms: initialFilters.bedrooms?.toString() || "",
      bathrooms: initialFilters.bathrooms?.toString() || "",
      city: initialFilters.city || "",
      state: initialFilters.state || "",
      type: initialFilters.type || "",
      furnished: initialFilters.furnished || "",
      listingType: initialFilters.listingType || "",
      isVerified: initialFilters.isVerified?.toString() || "",
      amenities: initialFilters.amenities || "",
      availableFrom: initialFilters.availableFromAfter || "",
      sort: initialFilters.sort || "",
    },
  });

  const onSubmit = (data: FiltersFormData) => {
    const filters: PropertyFiltersType = {
      ...(data.priceMin && data.priceMin.trim() !== '' && { priceMin: Number(data.priceMin) }),
      ...(data.priceMax && data.priceMax.trim() !== '' && { priceMax: Number(data.priceMax) }),
      ...(data.areaMin && data.areaMin.trim() !== '' && { areaMin: Number(data.areaMin) }),
      ...(data.areaMax && data.areaMax.trim() !== '' && { areaMax: Number(data.areaMax) }),
      ...(data.bedrooms && data.bedrooms.trim() !== '' && { bedrooms: Number(data.bedrooms) }),
      ...(data.bathrooms && data.bathrooms.trim() !== '' && { bathrooms: Number(data.bathrooms) }),
      ...(data.city && data.city.trim() !== '' && { city: data.city }),
      ...(data.state && data.state.trim() !== '' && { state: data.state }),
      ...(data.type && data.type.trim() !== '' && { type: data.type }),
      ...(data.furnished && data.furnished.trim() !== '' && { furnished: data.furnished }),
      ...(data.listingType && data.listingType.trim() !== '' && { listingType: data.listingType }),
      ...(data.isVerified && data.isVerified.trim() !== '' && { isVerified: data.isVerified === "true" }),
      ...(data.amenities && data.amenities.trim() !== '' && { amenities: data.amenities }),
      ...(data.availableFrom && data.availableFrom.trim() !== '' && { availableFromAfter: data.availableFrom }),
      ...(data.sort && data.sort.trim() !== '' && { sort: data.sort as PropertyFiltersType['sort'] }),
    };
    onFiltersChange(filters);
  };

  const clearFilters = () => {
    form.reset();
    onFiltersChange({});
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary hover:text-indigo-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Hide Filters
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show Filters
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Price Range */}
                <div>
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="priceMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Min" type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Max" type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Area */}
                <div>
                  <FormLabel className="block text-sm font-medium text-gray-700 mb-2">
                    Area (sq ft)
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="areaMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Min" type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="areaMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Max" type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                          <SelectItem value="5">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Bathrooms */}
                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="1">1+</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="3">3+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Property Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Types</SelectItem>
                          <SelectItem value="House">House</SelectItem>
                          <SelectItem value="Apartment">Apartment</SelectItem>
                          <SelectItem value="Condo">Condo</SelectItem>
                          <SelectItem value="Villa">Villa</SelectItem>
                          <SelectItem value="Townhouse">Townhouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Furnished */}
                <FormField
                  control={form.control}
                  name="furnished"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Furnished</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Any</SelectItem>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Partially">Partially</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Listing Type */}
                <FormField
                  control={form.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          <SelectItem value="Sale">Sale</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Lease">Lease</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Verified */}
                <FormField
                  control={form.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          <SelectItem value="true">Verified Only</SelectItem>
                          <SelectItem value="false">Unverified</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Filters */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amenities */}
                  <FormField
                    control={form.control}
                    name="amenities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amenities</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Swimming pool, Gym, Parking..."
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Available From */}
                  <FormField
                    control={form.control}
                    name="availableFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available From</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Filter Actions */}
              <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-200">
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear All Filters
                </Button>
                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="sort"
                    render={({ field }) => (
                      <FormItem>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Sort by: Newest" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="created_desc">Sort by: Newest</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="created_asc">Oldest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Apply Filters</Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
