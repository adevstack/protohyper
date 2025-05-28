import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Favorites from "@/pages/favorites";
import Recommendations from "@/pages/recommendations";
import NotFound from "@/pages/not-found";
import { useState } from "react";

interface RouterProps {
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
}

function Router({ showCreateForm, setShowCreateForm }: RouterProps) {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route
        path="/dashboard"
        component={() => (
          <Dashboard
            showCreateForm={showCreateForm}
            setShowCreateForm={setShowCreateForm}
          />
        )}
      />
      <Route path="/favorites" component={Favorites} />
      <Route path="/recommendations" component={Recommendations} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router
            showCreateForm={showCreateForm}
            setShowCreateForm={setShowCreateForm}
          />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
