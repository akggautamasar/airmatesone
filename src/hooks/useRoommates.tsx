
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
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching roommates for user:', user.email);
      
      // Query roommates table directly - no joins with users table
      const { data, error } = await supabase
        .from('roommates')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched roommates:', data);
      setRoommates(data || []);
    } catch (error: any) {
      console.error('Error fetching roommates:', error);
      toast({
        title: "Error",
        description: `Failed to fetch roommates: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRoommate = async (roommate: Omit<Roommate, 'id' | 'user_id' | 'balance'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add roommates",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding roommate:', roommate);
      console.log('Current user:', user.id);

      // Validate required fields
      if (!roommate.name || !roommate.upi_id || !roommate.email) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (name, UPI ID, and email)",
          variant: "destructive",
        });
        return;
      }

      // Check if roommate already exists for this user
      const { data: existingRoommate, error: checkError } = await supabase
        .from('roommates')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', roommate.email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing roommate:', checkError);
        throw checkError;
      }

      if (existingRoommate) {
        toast({
          title: "Error",
          description: "This roommate has already been added",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('roommates')
        .insert([{ 
          ...roommate, 
          user_id: user.id, 
          balance: 0 
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Successfully added roommate:', data);
      setRoommates(prev => [data, ...prev]);
      
      toast({
        title: "Roommate Added",
        description: `${roommate.name} has been added to your group`,
      });
    } catch (error: any) {
      console.error('Error adding roommate:', error);
      toast({
        title: "Error",
        description: `Failed to add roommate: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const deleteRoommate = async (roommateId: string) => {
    try {
      console.log('Deleting roommate:', roommateId);
      
      const { error } = await supabase
        .from('roommates')
        .delete()
        .eq('id', roommateId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
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
        description: `Failed to delete roommate: ${error.message}`,
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
    if (user) {
      fetchRoommates();
    }
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
