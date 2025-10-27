
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MarketTrip {
  id: string;
  user_id: string;
  user_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMarketTrips = () => {
  const [marketTrips, setMarketTrips] = useState<MarketTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoingToMarket, setIsGoingToMarket] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMarketTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('market_trips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMarketTrips(data || []);
      
      // Check if current user is going to market
      if (user) {
        const userTrip = data?.find(trip => trip.user_id === user.id);
        setIsGoingToMarket(!!userTrip);
      }
    } catch (error: any) {
      console.error('Error fetching market trips:', error);
      toast({
        title: "Error",
        description: "Failed to load market trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToMarket = async () => {
    if (!user) return;

    try {
      // Get user's name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const userName = profile?.name || user.email?.split('@')[0] || 'Unknown User';

      const { error } = await supabase
        .from('market_trips')
        .insert({
          user_id: user.id,
          user_name: userName,
          is_active: true
        });

      if (error) throw error;

      setIsGoingToMarket(true);
      await fetchMarketTrips();

      toast({
        title: "Success",
        description: "You're now going to market! Other roommates have been notified.",
      });
    } catch (error: any) {
      console.error('Error creating market trip:', error);
      toast({
        title: "Error",
        description: "Failed to register market trip",
        variant: "destructive",
      });
    }
  };

  const cancelMarketTrip = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('market_trips')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      setIsGoingToMarket(false);
      await fetchMarketTrips();

      toast({
        title: "Success",
        description: "Market trip cancelled",
      });
    } catch (error: any) {
      console.error('Error cancelling market trip:', error);
      toast({
        title: "Error",
        description: "Failed to cancel market trip",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchMarketTrips();

    // Create unique channel name to avoid conflicts
    const channelName = `market-trips-${user.id}-${Date.now()}`;
    console.log('Creating market trips channel:', channelName);

    // Set up real-time subscription for market trips
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'market_trips'
        },
        () => {
          console.log('Market trips data changed, refetching...');
          fetchMarketTrips();
        }
      )
      .subscribe((status) => {
        console.log('Market trips channel subscription status:', status);
      });

    return () => {
      console.log('Cleaning up market trips channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only depend on user ID to avoid unnecessary re-subscriptions

  return {
    marketTrips,
    loading,
    isGoingToMarket,
    goToMarket,
    cancelMarketTrip,
    refetch: fetchMarketTrips
  };
};
