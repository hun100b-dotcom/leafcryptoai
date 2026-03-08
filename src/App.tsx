import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { AILiveLogProvider } from "./contexts/AILiveLogContext";
import Index from "./pages/Index";
import Positions from "./pages/Positions";
import AIMentorAsset from "./pages/AIMentorAsset";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ViewModeProvider>
          <AILiveLogProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/ai-mentor" element={<AIMentorAsset />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AILiveLogProvider>
        </ViewModeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
