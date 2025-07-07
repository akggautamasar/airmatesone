
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  LogOut, 
  Home, 
  FileText, 
  Users, 
  ShoppingCart, 
  Calendar, 
  DollarSign, 
  Settings,
  BarChart3,
  StickyNote,
  ClipboardList
} from 'lucide-react';

const NavBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">AirMates</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/overview">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Overview</span>
                  </Button>
                </Link>
                <Link to="/expenses">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Expenses</span>
                  </Button>
                </Link>
                <Link to="/roommates">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Roommates</span>
                  </Button>
                </Link>
                <Link to="/shopping">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Shopping</span>
                  </Button>
                </Link>
                <Link to="/chores">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <ClipboardList className="h-4 w-4" />
                    <span>Chores</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(user.user_metadata?.name || user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.user_metadata?.name || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/pinboard" className="flex items-center">
                      <StickyNote className="mr-2 h-4 w-4" />
                      <span>Pinboard</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Mobile menu items */}
                  <div className="md:hidden">
                    <DropdownMenuItem asChild>
                      <Link to="/overview" className="flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Overview</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/expenses" className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span>Expenses</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/roommates" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Roommates</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/shopping" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Shopping</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/chores" className="flex items-center">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>Chores</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                  
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
