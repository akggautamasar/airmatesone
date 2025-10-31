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

interface RoommateData {
  name: string;
  email: string;
  upi_id: string;
  phone?: string;
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
      
      const { data, error } = await supabase
        .from('roommates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setRoommates(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch roommates: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRoommate = async (email: string, providedData?: RoommateData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add roommates",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      // Check if trying to add themselves
      if (email.toLowerCase() === user.email?.toLowerCase()) {
        toast({
          title: "Error",
          description: "You cannot add yourself as a roommate",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicates
      const { data: existingRoommate, error: checkError } = await supabase
        .from('roommates')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingRoommate) {
        toast({
          title: "Already Added",
          description: "This roommate has already been added to your list.",
          variant: "destructive",
        });
        return;
      }

      // Try to find the target user's profile to get their details
      const { data: targetUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, full_name, upi_id, mobile_number')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      // Create roommate entry for current user with target user's details or provided data
      let roommateData;
      if (providedData) {
        // Use provided data first, but update with profile data if available
        roommateData = { 
          name: targetUserProfile?.name || targetUserProfile?.full_name || providedData.name,
          upi_id: targetUserProfile?.upi_id || providedData.upi_id,
          email: email.toLowerCase(),
          phone: targetUserProfile?.mobile_number || providedData.phone || null,
          user_id: user.id,
          balance: 0 
        };
      } else if (targetUserProfile) {
        // Use target user's profile data
        roommateData = { 
          name: targetUserProfile.name || targetUserProfile.full_name || email.split('@')[0] || 'Unknown User',
          upi_id: targetUserProfile.upi_id || 'Not set',
          email: email.toLowerCase(),
          phone: targetUserProfile.mobile_number || null,
          user_id: user.id,
          balance: 0 
        };
      } else {
        // Fallback: use email prefix as name
        roommateData = { 
          name: email.split('@')[0] || 'Unknown User',
          upi_id: 'Not set',
          email: email.toLowerCase(),
          phone: null,
          user_id: user.id,
          balance: 0 
        };
      }

      const { error: currentUserRoommateError } = await supabase
        .from('roommates')
        .insert([roommateData]);

      if (currentUserRoommateError) {
        throw currentUserRoommateError;
      }

      // Create reciprocal entry only if target user exists
      if (targetUserProfile) {
        // Get current user's profile for reciprocal entry
        const { data: currentUserProfile, error: currentProfileError } = await supabase
          .from('profiles')
          .select('id, email, name, full_name, upi_id, mobile_number')
          .eq('id', user.id)
          .single();

        if (!currentProfileError && currentUserProfile) {
          const reciprocalData = { 
            name: currentUserProfile.name || currentUserProfile.full_name || user.email?.split('@')[0] || 'Unknown User',
            upi_id: currentUserProfile.upi_id || 'Not set',
            email: user.email || '',
            phone: currentUserProfile.mobile_number || null,
            user_id: targetUserProfile.id,
            balance: 0 
          };

          const { error: targetUserRoommateError } = await supabase
            .from('roommates')
            .insert([reciprocalData]);

          if (targetUserRoommateError) {
            console.error('Failed to create reciprocal roommate entry:', targetUserRoommateError);
          }
        }
      }

      await fetchRoommates();
      
      toast({
        title: "🎉 Success!",
        description: targetUserProfile 
          ? `${targetUserProfile.name || targetUserProfile.full_name || email} added successfully with their profile details!`
          : `Roommate added successfully! They can update their profile to show complete details.`,
      });
      
    } catch (error: any) {
      toast({
        title: "Addition Failed",
        description: `Could not add roommate: ${error.message || 'Unknown error occurred'}`,
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
      
      await fetchRoommates();
      
      toast({
        title: "Roommate Removed",
        description: "Roommate has been removed from your group",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete roommate: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteAllMyRoommates = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('roommates')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchRoommates();
      
      toast({
        title: "All Roommates Removed",
        description: "All roommates you added have been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to remove all roommates: ${error.message}`,
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
            <h2 style="color: #2563eb;">Payment Request</h2>
            <p>Hi ${roommate.name},</p>
            <p>You have a pending payment request on AirMates.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0; color: #374151; font-size: 24px;">Amount Due: ₹${Math.abs(roommate.balance)}</h3>
            </div>
            <p>Please settle this amount at your earliest convenience.</p>
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
    } else {
      setRoommates([]);
      setLoading(false);
    }
  }, [user]);

  return {
    roommates,
    loading,
    addRoommate,
    deleteRoommate,
    deleteAllMyRoommates,
    sendEmailRequest,
    refetch: fetchRoommates
  };
};
