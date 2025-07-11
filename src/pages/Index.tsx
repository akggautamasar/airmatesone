
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { ExpenseOverview } from '@/components/ExpenseOverview';
import { UpcomingEvents } from '@/components/overview/UpcomingEvents';

export default function Index() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.user_metadata?.name || user.email?.split('@')[0]}!</h1>
            <p className="text-muted-foreground">
              Manage your expenses, chores, settlements, and shopping lists.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link to="/overview">
              <Button variant="outline" className="w-full h-24 text-lg">
                📊 Overview
              </Button>
            </Link>
            <Link to="/expenses">
              <Button variant="outline" className="w-full h-24 text-lg">
                💰 Expenses
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" className="w-full h-24 text-lg">
                📋 Reports
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" className="w-full h-24 text-lg">
                📅 Events
              </Button>
            </Link>
            <Link to="/shopping">
              <Button variant="outline" className="w-full h-24 text-lg">
                🛒 Shopping
              </Button>
            </Link>
            <Link to="/chores">
              <Button variant="outline" className="w-full h-24 text-lg">
                🧹 Chores
              </Button>
            </Link>
            <Link to="/roommates">
              <Button variant="outline" className="w-full h-24 text-lg">
                👥 Roommates
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full h-24 text-lg">
                👤 Profile
              </Button>
            </Link>
            <Link to="/pinboard">
              <Button variant="outline" className="w-full h-24 text-lg">
                📌 Pinboard
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
