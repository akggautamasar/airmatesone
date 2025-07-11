
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import PinboardPage from "./pages/PinboardPage";
import ExpenseTrackerPage from "./pages/ExpenseTrackerPage";
import ChoresPage from "./pages/ChoresPage";
import OverviewPage from "./pages/OverviewPage";
import ExpensesPage from "./pages/ExpensesPage";
import RoommatesPage from "./pages/RoommatesPage";
import ShoppingPage from "./pages/ShoppingPage";
import EventsPage from "./pages/EventsPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import { requestPushPermission } from "./firebase/firebase-messaging-init";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    requestPushPermission();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/roommates" element={<RoommatesPage />} />
              <Route path="/shopping" element={<ShoppingPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pinboard" element={<PinboardPage />} />
              <Route path="/expense-tracker" element={<ExpenseTrackerPage />} />
              <Route path="/chores" element={<ChoresPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
