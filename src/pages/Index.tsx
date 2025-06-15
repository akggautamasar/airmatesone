
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavBar } from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseOverview } from "@/components/ExpenseOverview";
import { ExpensesPage } from "@/components/ExpensesPage";
import { RoommateManagement } from "@/components/RoommateManagement";
import { Profile } from "@/components/Profile";
import { useExpenses } from "@/hooks/useExpenses";
import { useRoommates } from "@/hooks/useRoommates";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getCurrentUserDisplayName } from "@/utils/userDisplay";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { roommates } = useRoommates();
  const { profile } = useProfile();

  useEffect(() => {
    console.log('Index page - user:', user?.email, 'authLoading:', authLoading);
    if (!authLoading && !user) {
      console.log('Redirecting to auth page');
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const overallLoading = authLoading || expensesLoading;

  if (overallLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Welcome to AirMates
          </h1>
          <p className="text-gray-600 max-w-md">
            Your smart roommate expense manager. Track shared expenses, manage settlements, and keep everyone happy.
          </p>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentUserDisplayName = getCurrentUserDisplayName(profile, user);

  const formattedExpenses = expenses.map(expense => ({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    paidBy: expense.paid_by,
    date: new Date(expense.date).toISOString(),
    category: expense.category,
    sharers: expense.sharers || []
  }));
  
  const handleExpenseUpdate = () => {
    refetchExpenses();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.email && user.email.split('@')[0]}!</h1>
          <p className="text-gray-600">Manage your expenses and settlements.</p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="roommates">Roommates</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ExpenseOverview 
              expenses={formattedExpenses}
              onExpenseUpdate={handleExpenseUpdate}
              currentUserId={user.id}
            />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <ExpensesPage />
          </TabsContent>

          <TabsContent value="roommates" className="space-y-6">
            <RoommateManagement />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Profile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
