
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarketNotificationProps {
  onClose: () => void;
}

export const MarketNotification = ({ onClose }: MarketNotificationProps) => {
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const { toast } = useToast();

  const handleNotify = () => {
    if (!time) {
      toast({
        title: "Missing Information",
        description: "Please select a time for your market trip.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Market Trip Notification Sent!",
      description: "All roommates have been notified about your market trip.",
    });

    // Simulate notification to all roommates
    setTimeout(() => {
      toast({
        title: "Roommates Responded!",
        description: "3 roommates have added items to the grocery list.",
      });
    }, 2000);

    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Going to Market</span>
          </DialogTitle>
          <DialogDescription>
            Notify your roommates about your market trip so they can add items to the grocery list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Market/Store (Optional)</Label>
            <Input
              id="location"
              placeholder="e.g., Big Bazaar, Local Market"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Notification Preview</h4>
                <p className="text-sm text-blue-700 mt-1">
                  "🛒 I'm going to the market {time && `at ${new Date(time).toLocaleString()}`}
                  {location && ` (${location})`}. Add any items you need to the grocery list!"
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Roommates will be notified immediately</span>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleNotify}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Notify Roommates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
