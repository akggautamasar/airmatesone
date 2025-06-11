
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Roommate {
  id: string;
  name: string;
  upi_id: string;
  email: string;
  phone?: string;
  balance: number;
  user_id: string;
}

export const useRoommates = () => {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRoommates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('roommates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoommates(data || []);
    } catch (error: any) {
      console.error('Error fetching roommates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch roommates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRoommate = async (roommate: Omit<Roommate, 'id' | 'user_id' | 'balance'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('roommates')
        .insert([{ ...roommate, user_id: user.id, balance: 0 }])
        .select()
        .single();

      if (error) throw error;
      setRoommates(prev => [data, ...prev]);
      
      toast({
        title: "Roommate Added",
        description: `${roommate.name} has been added to your group`,
      });
    } catch (error: any) {
      console.error('Error adding roommate:', error);
      toast({
        title: "Error",
        description: "Failed to add roommate",
        variant: "destructive",
      });
    }
  };

  const deleteRoommate = async (roommateId: string) => {
    try {
      const { error } = await supabase
        .from('roommates')
        .delete()
        .eq('id', roommateId);

      if (error) throw error;
      
      const deletedRoommate = roommates.find(r => r.id === roommateId);
      setRoommates(prev => prev.filter(roommate => roommate.id !== roommateId));
      
      toast({
        title: "Roommate Removed",
        description: `${deletedRoommate?.name} has been removed from your group`,
      });
    } catch (error: any) {
      console.error('Error deleting roommate:', error);
      toast({
        title: "Error",
        description: "Failed to delete roommate",
        variant: "destructive",
      });
    }
  };

  const sendEmailRequest = async (roommate: Roommate) => {
    try {
      const emailData = {
        to: [roommate.email],
        subject: "Payment Request from AirMates",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">AirMates</h1>
              <p style="color: #6b7280; margin: 5px 0;">Your Smart Roommate Expense Manager</p>
            </div>
            
            <h2 style="color: #2563eb;">Payment Request</h2>
            <p>Hi ${roommate.name},</p>
            <p>You have a pending payment request on AirMates.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0; color: #374151; font-size: 24px;">Amount Due: ₹${Math.abs(roommate.balance)}</h3>
              <p style="margin: 10px 0 0 0; color: #6b7280;">Please settle this amount at your earliest convenience.</p>
            </div>
            
            <p>You can make the payment using your UPI ID: <strong>${roommate.upi_id}</strong></p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0;">Best regards,<br/>
              <strong>AirMates Team</strong><br/>
              <span style="color: #6b7280;">Managing roommate expenses made easy</span></p>
            </div>
          </div>
        `,
        from: "AirMates <AirMates@airmedisphere.in>"
      };

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) throw error;

      toast({
        title: "Request Sent!",
        description: `Payment request email sent to ${roommate.name}`,
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to Send Request",
        description: `Failed to send email to ${roommate.name}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, [user]);

  return {
    roommates,
    loading,
    addRoommate,
    deleteRoommate,
    sendEmailRequest,
    refetch: fetchRoommates
  };
};
