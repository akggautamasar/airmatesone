import React from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrowserNotificationManager } from '@/components/notifications/BrowserNotificationManager';
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
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <Link to="/overview" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-base sm:text-lg lg:text-xl">AirMates</span>
          </Link>
          
          {user && (
            <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-3xl mx-4">
              <Link to="/overview">
                <Button variant="ghost" size="sm" className="text-sm">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Overview
                </Button>
              </Link>
              <Link to="/expenses">
                <Button variant="ghost" size="sm" className="text-sm">
                  <DollarSign className="h-4 w-4 mr-1.5" />
                  Expenses
                </Button>
              </Link>
              <Link to="/shopping">
                <Button variant="ghost" size="sm" className="text-sm">
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  Shopping
                </Button>
              </Link>
              <Link to="/chores">
                <Button variant="ghost" size="sm" className="text-sm">
                  <ClipboardList className="h-4 w-4 mr-1.5" />
                  Chores
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="ghost" size="sm" className="text-sm">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  Events
                </Button>
              </Link>
              <Link to="/roommates">
                <Button variant="ghost" size="sm" className="text-sm">
                  <Users className="h-4 w-4 mr-1.5" />
                  Roommates
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {user ? (
              <>
                <BrowserNotificationManager />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full p-0">
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {getInitials(user.user_metadata?.name || user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.user_metadata?.name || user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium text-sm">{user.user_metadata?.name || 'User'}</p>
                      <p className="w-[180px] truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Mobile/Tablet menu items */}
                  <div className="lg:hidden">
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
                    <DropdownMenuItem asChild>
                      <Link to="/events" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Events</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/roommates" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Roommates</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/reports" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Reports</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/pinboard" className="flex items-center">
                      <StickyNote className="mr-2 h-4 w-4" />
                      <span>Pinboard</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
