import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/Header";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyModal } from "@/components/PropertyModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Home, TrendingUp, Heart, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { authRequest } from "@/lib/auth";
import { insertPropertySchema, type PropertyWithOwner, type InsertProperty } from "@shared/schema";
import { z } from "zod";

const propertyFormSchema = insertPropertySchema.extend({
  price: z.string().min(1, "Price is required"),
  areaSqFt: z.string().min(1, "Area is required"),
  bedrooms: z.string().min(1, "Bedrooms is required"),
  bathrooms: z.string().min(1, "Bathrooms is required"),
  rating: z.string().optional(),
  colorTheme: z.string().default("#6ab45e"),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

type DashboardProps = {
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
};

export default function Dashboard({ showCreateForm, setShowCreateForm }: DashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOwner | null>(null);
  const [editingProperty, setEditingProperty] = useState<PropertyWithOwner | null>(null);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      areaSqFt: "",
      bedrooms: "",
      bathrooms: "",
      city: "",
      state: "",
      country: "",
      type: "",
      furnished: "",
      listedBy: "",
      listingType: "",
      isVerified: false,
      rating: "",
      amenities: "",
      tags: "",
      availableFrom: undefined,
      imageUrl: "",
      colorTheme: "#6ab45e",
    },
  });

  // Fetch user's properties
  const { data: userProperties, isLoading } = useQuery({
    queryKey: ['/api/v1/properties', { createdBy: user?.id }],
    queryFn: async () => {
      const response = await authRequest('GET', '/api/v1/properties');
      const data = await response.json();
      // Filter to only show current user's properties
      return {
        ...data,
        properties: data.properties.filter((p: PropertyWithOwner) => p.createdBy === user?.id)
      };
    },
    enabled: !!user,
  });

  // Fetch dashboard stats
  const { data: favorites } = useQuery({
    queryKey: ['/api/v1/favorites'],
    queryFn: async () => {
      const response = await authRequest('GET', '/api/v1/favorites');
      return response.json();
    },
    enabled: !!user,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['/api/v1/recommendations'],
    queryFn: async () => {
      const response = await authRequest('GET', '/api/v1/recommendations');
      return response.json();
    },
    enabled: !!user,
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const response = await authRequest('POST', '/api/v1/properties', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/properties'] });
      toast({
        title: "Success",
        description: "Property created successfully!",
      });
      setShowCreateForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create property",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProperty> }) => {
      const response = await authRequest('PATCH', `/api/v1/properties/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/properties'] });
      toast({
        title: "Success",
        description: "Property updated successfully!",
      });
      setEditingProperty(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update property",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      await authRequest('DELETE', `/api/v1/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/properties'] });
      toast({
        title: "Success",
        description: "Property deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete property",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PropertyFormData) => {
    const propertyData: InsertProperty = {
      ...data,
      price: data.price,
      areaSqFt: parseInt(data.areaSqFt),
      bedrooms: parseInt(data.bedrooms),
      bathrooms: parseInt(data.bathrooms),
      rating: data.rating ? data.rating : undefined,
      availableFrom: data.availableFrom ? new Date(data.availableFrom) : undefined,
      colorTheme: data.colorTheme || "#6ab45e",
    };

    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data: propertyData });
    } else {
      createPropertyMutation.mutate(propertyData);
    }
  };

  const startEdit = (property: PropertyWithOwner) => {
    setEditingProperty(property);
    form.reset({
      title: property.title,
      description: property.description || "",
      price: property.price,
      areaSqFt: property.areaSqFt.toString(),
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      city: property.city,
      state: property.state,
      country: property.country,
      type: property.type,
      furnished: property.furnished,
      listedBy: property.listedBy,
      listingType: property.listingType,
      isVerified: property.isVerified,
      rating: property.rating || "",
      amenities: property.amenities || "",
      tags: property.tags || "",
      availableFrom: property.availableFrom ? new Date(property.availableFrom) : undefined,
      imageUrl: property.imageUrl || '',
      colorTheme: property.colorTheme || "#6ab45e",
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      deletePropertyMutation.mutate(id);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header setShowCreateForm={() => {}} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
              <p className="text-gray-600">Please login to access your dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header setShowCreateForm={setShowCreateForm} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">Manage your properties and track your performance.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Properties Listed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userProperties?.properties?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Favorites</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {favorites?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recommendations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recommendations?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-success" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userProperties?.properties?.length > 0 
                      ? (userProperties.properties.reduce((acc: number, p: PropertyWithOwner) => 
                          acc + parseFloat(p.rating || "0"), 0) / userProperties.properties.length).toFixed(1)
                      : "0.0"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Properties</h2>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProperty ? 'Edit Property' : 'Add New Property'}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Property title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input placeholder="Price" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="House">House</SelectItem>
                              <SelectItem value="Apartment">Apartment</SelectItem>
                              <SelectItem value="Condo">Condo</SelectItem>
                              <SelectItem value="Villa">Villa</SelectItem>
                              <SelectItem value="Townhouse">Townhouse</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="listingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select listing type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Sale">Sale</SelectItem>
                              <SelectItem value="Rent">Rent</SelectItem>
                              <SelectItem value="Lease">Lease</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="areaSqFt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area (sq ft)</FormLabel>
                          <FormControl>
                            <Input placeholder="Area in square feet" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <FormControl>
                            <Input placeholder="Number of bedrooms" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms</FormLabel>
                          <FormControl>
                            <Input placeholder="Number of bathrooms" type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="furnished"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Furnished</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select furnished status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Partially">Partially</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="listedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listed By</FormLabel>
                          <FormControl>
                            <Input placeholder="Listed by" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="colorTheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Theme</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} value={field.value || "#6ab45e"} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Property description" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amenities (pipe-separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="Pool|Gym|Parking|Garden" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (pipe-separated)</FormLabel>
                          <FormControl>
                            <Input placeholder="Modern|Luxury|Spacious" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availableFrom"
                      render={({ field }) => {
                        let value = "";
                        if (field.value instanceof Date && !isNaN(field.value.getTime())) {
                          value = field.value.toISOString().slice(0, 10);
                        } else if (typeof field.value === "string") {
                          value = field.value;
                        }
                        return (
                          <FormItem>
                            <FormLabel>Available From</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={value} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isVerified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Verified Property</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingProperty(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPropertyMutation.isPending || updatePropertyMutation.isPending}
                    >
                      {createPropertyMutation.isPending || updatePropertyMutation.isPending 
                        ? 'Saving...' 
                        : editingProperty ? 'Update Property' : 'Create Property'
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Edit Property Dialog */}
          <Dialog open={!!editingProperty} onOpenChange={(open) => {
            if (!open) {
              setEditingProperty(null);
              form.reset();
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Property</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Same form fields as create - simplified for brevity */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditingProperty(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updatePropertyMutation.isPending}
                    >
                      {updatePropertyMutation.isPending ? 'Updating...' : 'Update Property'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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
                </div>
              </div>
            ))}
          </div>
        ) : userProperties?.properties?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProperties.properties.map((property: PropertyWithOwner) => (
              <div key={property.id} className="relative">
                <PropertyCard
                  property={property}
                  onViewDetails={setSelectedProperty}
                />
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      startEdit(property);
                      setShowCreateForm(true);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(property.id)}
                    disabled={deletePropertyMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first property to get started.</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Property
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
      />
    </div>
  );
}
