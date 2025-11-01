
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user.user_metadata?.name || user.email?.split('@')[0]}!</h1>
              <p className="text-muted-foreground text-lg">
                Your roommate dashboard - everything you need at a glance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <OneSignalTestButton />
              <NotificationBell />
            </div>
          </div>

          {/* Quick Access */}
          <div className="mb-6">
            <Link to="/expenses">
              <Button size="lg" className="w-full md:w-auto">
                <Wallet className="mr-2 h-5 w-5" />
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to AirMates
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The ultimate roommate management platform. Track expenses, manage chores, 
            plan events, and stay organized with your roommates.
          </p>
          
          <div className="space-y-4 mb-12">
            <Link to="/auth">
              <Button size="lg" className="px-8 py-3 text-lg">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg border bg-card">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Expense Tracking</h3>
              <p className="text-muted-foreground">
                Split bills, track expenses, and manage settlements with ease.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border bg-card">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">Shared Notes</h3>
              <p className="text-muted-foreground">
                Keep everyone in the loop with shared notes and reminders.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border bg-card">
              <div className="text-4xl mb-4">🧹</div>
              <h3 className="text-xl font-semibold mb-2">Chore Management</h3>
              <p className="text-muted-foreground">
                Organize household tasks and track completion with roommates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
