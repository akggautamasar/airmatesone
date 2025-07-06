import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';

export default function Index() {
  const { user } = useAuth();

  if (user) {
    
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to AirMates</h1>
            <p className="text-xl text-muted-foreground">
              Your roommate management platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Link to="/pinboard">
              <Button variant="outline" className="w-full h-24 text-lg">
                📌 Pinboard
              </Button>
            </Link>
            <Link to="/expense-tracker">
              <Button variant="outline" className="w-full h-24 text-lg">
                💰 Expense Tracker
              </Button>
            </Link>
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
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-semibold mb-2">Shopping Lists</h3>
              <p className="text-muted-foreground">
                Collaborate on shopping lists and never forget items again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
