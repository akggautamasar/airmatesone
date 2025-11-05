
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { ExpenseOverview } from '@/components/ExpenseOverview';
import { UpcomingEvents } from '@/components/overview/UpcomingEvents';
import { InstallPrompt } from '@/components/InstallPrompt';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { OneSignalPrompt } from '@/components/notifications/OneSignalPrompt';
import { OneSignalTestButton } from '@/components/notifications/OneSignalTestButton';
import { Wallet } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <InstallPrompt />
        <OneSignalPrompt />
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                Welcome back, {user.user_metadata?.name || user.email?.split('@')[0]}!
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Your roommate dashboard - everything you need at a glance.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <OneSignalTestButton />
              <NotificationBell />
            </div>
          </div>

          {/* Quick Access */}
          <div className="mb-6">
            <Link to="/expenses" className="block">
              <Button size="lg" className="w-full sm:w-auto">
                <Wallet className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Manage Expenses
              </Button>
            </Link>
          </div>

          {/* Dashboard Overview */}
          <div className="space-y-6">
            <ExpenseOverview onExpenseUpdate={() => {}} currentUserId={user.id} />
            <UpcomingEvents />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <InstallPrompt />
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to AirMates
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            The ultimate roommate management platform. Track expenses, manage chores, 
            plan events, and stay organized with your roommates.
          </p>
          
          <div className="space-y-4 mb-8 sm:mb-12">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-12 lg:mt-16">
            <div className="p-4 sm:p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💰</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Expense Tracking</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Split bills, track expenses, and manage settlements with ease.
              </p>
            </div>
            
            <div className="p-4 sm:p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📝</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Shared Notes</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Keep everyone in the loop with shared notes and reminders.
              </p>
            </div>
            
            <div className="p-4 sm:p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🧹</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Chore Management</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Organize household tasks and track completion with roommates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
