import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { FifaTeamsProvider } from "@/components/FifaTeamsProvider";
import { PatternDefs } from "@/components/PatternDefs";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AccessibilityProvider>
      <FifaTeamsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PatternDefs />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/play" element={<Index />} />
            <Route path="/summary" element={<Index />} />
            <Route path="/practice" element={<Index />} />
            <Route path="/practice/results" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </FifaTeamsProvider>
    </AccessibilityProvider>
  </QueryClientProvider>
);

export default App;
