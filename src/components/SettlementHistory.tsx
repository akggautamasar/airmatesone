
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Clock } from "lucide-react";

const SettlementHistory = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement History</CardTitle>
        <CardDescription>
          Your past settlement transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No settlement history yet</p>
          <p className="text-sm">Your completed settlements will appear here</p>
        </div>
      </CardContent>
    </Card>
  );
};

export { SettlementHistory };
