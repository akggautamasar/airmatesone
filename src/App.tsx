
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SharedNotesProvider } from "@/contexts/SharedNotesContext";
import { NotificationPermissionDialog } from "@/components/notifications/NotificationPermissionDialog";
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

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <SharedNotesProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NotificationPermissionDialog />
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
          </SharedNotesProvider>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
