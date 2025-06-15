
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, MapPin, X } from "lucide-react";
import { useMarketTrips } from '@/hooks/useMarketTrips';

export const MarketStatus = () => {
  const { marketTrips, loading, isGoingToMarket, goToMarket, cancelMarketTrip } = useMarketTrips();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeTrips = marketTrips.filter(trip => trip.is_active);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <span>Market Status</span>
          {activeTrips.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeTrips.length} going
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current market trips */}
        {activeTrips.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Currently going to market:
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeTrips.map((trip) => (
                <Badge 
                  key={trip.id} 
                  variant="outline" 
                  className="border-green-200 text-green-700 bg-green-50"
                >
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {trip.user_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Market trip button */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {activeTrips.length === 0 
              ? "No one is going to market yet" 
              : "Join them or add items to the shared list"
            }
          </div>
          <div className="flex gap-2">
            {isGoingToMarket ? (
              <Button
                onClick={cancelMarketTrip}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel Trip
              </Button>
            ) : (
              <Button
                onClick={goToMarket}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                I'm Going to Market
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
