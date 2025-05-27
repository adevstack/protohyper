import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/v1/auth/me"],
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        localStorage.removeItem("authToken");
        setToken(null);
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/v1/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("authToken", data.token);
      queryClient.setQueryData(["/api/v1/auth/me"], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/v1/auth/register", { name, email, password });
      return response.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem("authToken", data.token);
      queryClient.setQueryData(["/api/v1/auth/me"], data.user);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (name: string, email: string, password: string) => {
    await registerMutation.mutateAsync({ name, email, password });
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
    queryClient.clear();
  };

  // Set up axios interceptor to include token
  useEffect(() => {
    if (token) {
      queryClient.setDefaultOptions({
        queries: {
          queryFn: async ({ queryKey }) => {
            const response = await fetch(queryKey[0] as string, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (!response.ok) {
              if (response.status === 401) {
                localStorage.removeItem("authToken");
                setToken(null);
                queryClient.clear();
              }
              throw new Error(`${response.status}: ${response.statusText}`);
            }
            return response.json();
          },
        },
      });
    }
  }, [token, queryClient]);

  const contextValue: AuthContextType = {
    user: user || null,
    login,
    register,
    logout,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
