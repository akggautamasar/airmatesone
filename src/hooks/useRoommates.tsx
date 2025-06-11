
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Payment Request from AirMates</h2>
            <p>Hi ${roommate.name},</p>
            <p>You have a pending payment request on AirMates.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0; color: #374151;">Amount Due: ₹${Math.abs(roommate.balance)}</h3>
            </div>
            <p>Please settle this amount at your earliest convenience.</p>
            <p>Best regards,<br/>AirMates Team</p>
          </div>
        `
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
