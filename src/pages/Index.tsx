import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavBar } from "@/components/NavBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseOverview } from "@/components/ExpenseOverview";
import { ExpensesPage } from "@/components/ExpensesPage";
import { RoommateManagement } from "@/components/RoommateManagement";
import { Profile } from "@/components/Profile";
import { ShoppingPage } from "@/components/ShoppingPage";
import { useExpenses } from "@/hooks/useExpenses";
import { useRoommates } from "@/hooks/useRoommates";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getCurrentUserDisplayName } from "@/utils/userDisplay";
import { ChoresPage } from "@/components/ChoresPage";
import { ReportsPage } from "@/components/ReportsPage";
import { LayoutGrid, FileText, ShoppingCart, Users, User, ClipboardList, FilePieChart } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { refetch: refetchExpenses } = useExpenses();
  const { roommates } = useRoommates();
  const { profile } = useProfile();

  useEffect(() => {
    console.log('Index page - user:', user?.email, 'authLoading:', authLoading);
    if (!authLoading && !user) {
      console.log('Redirecting to auth page');
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
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
  
  const handleExpenseUpdate = () => {
    refetchExpenses();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {currentUserDisplayName}!</h1>
          <p className="text-gray-600">Manage your expenses, chores, settlements, and shopping lists.</p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-7 gap-2">
            <TabsTrigger value="overview" className="flex items-center space-x-2"><LayoutGrid className="h-4 w-4" /><span>Overview</span></TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center space-x-2"><FileText className="h-4 w-4" /><span>Expenses</span></TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2"><FilePieChart className="h-4 w-4" /><span>Reports</span></TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center space-x-2"><ShoppingCart className="h-4 w-4" /><span>Shopping</span></TabsTrigger>
            <TabsTrigger value="chores" className="flex items-center space-x-2"><ClipboardList className="h-4 w-4" /><span>Chores</span></TabsTrigger>
            <TabsTrigger value="roommates" className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>Roommates</span></TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2"><User className="h-4 w-4" /><span>Profile</span></TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ExpenseOverview 
              onExpenseUpdate={handleExpenseUpdate}
              currentUserId={user.id}
            />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <ExpensesPage onExpenseUpdate={handleExpenseUpdate} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsPage />
          </TabsContent>

          <TabsContent value="shopping" className="space-y-6">
            <ShoppingPage />
          </TabsContent>

          <TabsContent value="chores" className="space-y-6">
            <ChoresPage />
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
