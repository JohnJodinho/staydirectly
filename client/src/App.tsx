import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import PropertyDetail from "@/pages/PropertyDetail";
import SearchResults from "@/pages/SearchResults";
import CityPage from "@/pages/CityPage";
import Admin from "@/pages/Admin";
import ApiPropertiesPage from "@/pages/ApiPropertiesPage";
import ApiPropertyDetailPage from "@/pages/ApiPropertyDetailPage";
import HospitableSearch from "@/pages/HospitableSearch";
import AirbnbImport from "@/pages/AirbnbImport";
import HospitableConnect from "@/pages/HospitableConnect";
import CustomerListings from "@/pages/CustomerListings";
import PublishedProperties from "@/pages/PublishedProperties";
import HospitableIntegration from "@/pages/HospitableIntegration";
import HospitableImport from "@/pages/HospitableImport";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { APIProvider } from "@vis.gl/react-google-maps"; 

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/property/:slug" component={PropertyDetail} />
          <Route path="/search" component={SearchResults} />
          <Route path="/city/:name" component={CityPage} />
          <Route path="/admin" component={Admin} />
          <Route path="/api-properties" component={ApiPropertiesPage} />
          <Route path="/api-properties/:id" component={ApiPropertyDetailPage} />
          <Route path="/hospitable-search" component={HospitableSearch} />
          <Route path="/connect" component={HospitableConnect} />
          <Route path="/customer-listings" component={CustomerListings} />
          <Route path="/published-properties" component={PublishedProperties} />
          <Route path="/hospitable-integration" component={HospitableIntegration} />
          <Route path="/import" component={HospitableImport} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  
  return (
    <QueryClientProvider client={queryClient}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Router />
      </APIProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
