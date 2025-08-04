import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initializeOneSignal } from "@/lib/oneSignal";
import Index from "./pages/Index";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Detect iOS Safari
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Initialize OneSignal with iOS-specific handling
    const initOneSignal = async () => {
      try {
        if (isIOSSafari) {
          // Add a small delay for iOS Safari to ensure DOM is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        await initializeOneSignal();
      } catch (error) {
        console.error('OneSignal initialization failed:', error);
        // Don't block app loading if OneSignal fails - especially critical for iOS
      }
    };
    
    initOneSignal();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
