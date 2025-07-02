
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
      
      // Query roommates table. RLS policy will ensure only relevant roommates are returned.
      const { data, error } = await supabase
        .from('roommates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching roommates:', error);
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

  const ensureUserInProfiles = async (email: string) => {
    try {
      // Check if user exists in profiles table
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      return existingProfile;
    } catch (error) {
      console.error('Error ensuring user in profiles:', error);
      return null;
    }
  };

  const createBidirectionalRoommateRelation = async (currentUser: any, targetEmail: string, roommateData: Omit<Roommate, 'id' | 'user_id' | 'balance'>) => {
    try {
      console.log('🔄 Creating bidirectional roommate relationship');
      
      // Get target user's profile
      const { data: targetProfile, error: targetError } = await supabase
        .from('profiles')
        .select('id, email, name, upi_id')
        .eq('email', targetEmail.toLowerCase().trim())
        .maybeSingle();

      if (targetError || !targetProfile) {
        throw new Error('Target user profile not found');
      }

      // Get current user's profile
      const { data: currentProfile, error: currentError } = await supabase
        .from('profiles')
        .select('id, email, name, upi_id')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (currentError || !currentProfile) {
        throw new Error('Current user profile not found');
      }

      console.log('👥 Creating roommate entries for both users');

      // Create roommate entry for current user (adding target as roommate)
      const { error: currentUserRoommateError } = await supabase
        .from('roommates')
        .insert([{ 
          name: roommateData.name,
          upi_id: roommateData.upi_id,
          email: targetEmail.toLowerCase().trim(),
          phone: roommateData.phone || null,
          user_id: currentUser.id,
          balance: 0 
        }]);

      if (currentUserRoommateError) {
        console.error('❌ Failed to create roommate for current user:', currentUserRoommateError);
        throw currentUserRoommateError;
      }

      // Create reciprocal roommate entry for target user (adding current user as roommate)
      const { error: targetUserRoommateError } = await supabase
        .from('roommates')
        .insert([{ 
          name: currentProfile.name || currentProfile.email?.split('@')[0] || 'Unknown',
          upi_id: currentProfile.upi_id || 'Not set',
          email: currentProfile.email,
          phone: null, // We don't have current user's phone in this context
          user_id: targetProfile.id,
          balance: 0 
        }]);

      if (targetUserRoommateError) {
        console.error('❌ Failed to create reciprocal roommate entry:', targetUserRoommateError);
        // Don't throw here as the first entry was successful
        console.warn('⚠️ Roommate relationship is not fully bidirectional');
      } else {
        console.log('✅ Successfully created bidirectional roommate relationship');
      }

    } catch (error) {
      console.error('💥 Error creating bidirectional relationship:', error);
      throw error;
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
      console.log('🚀 STARTING ROOMMATE ADDITION PROCESS');
      console.log('Adding roommate:', roommate);
      console.log('Current user:', user.id, user.email);

      // Validate required fields
      if (!roommate.name || !roommate.upi_id || !roommate.email) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (name, UPI ID, and email)",
          variant: "destructive",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(roommate.email)) {
        toast({
          title: "Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      // Check if trying to add themselves
      if (roommate.email.toLowerCase().trim() === user.email?.toLowerCase()) {
        toast({
          title: "Error",
          description: "You cannot add yourself as a roommate",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 STEP 1: USER VERIFICATION - Checking if user exists:', roommate.email);
      
      // Check if user exists in profiles table
      const profileData = await ensureUserInProfiles(roommate.email);
      
      if (!profileData) {
        console.log('❌ VERIFICATION FAILED - User does not exist in database');
        console.log('📧 Email searched:', roommate.email);
        
        toast({
          title: "❌ User Not Found",
          description: `No AirMates account found for "${roommate.email}".

The user must:
1. Create an AirMates account first
2. Complete email verification  
3. Then you can add them

Double-check the email spelling.`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ STEP 1 COMPLETE - USER EXISTS!');
      console.log('📧 Found profile:', profileData);
      
      toast({
        title: "✅ User Verified",
        description: `Found account for ${roommate.email}! Adding to your group...`,
      });

      console.log('🔍 STEP 2: DUPLICATE CHECK - Checking for existing roommate');
      
      // Check if roommate already exists for this user (creator)
      const { data: existingRoommate, error: checkError } = await supabase
        .from('roommates')
        .select('id')
        .eq('user_id', user.id)
        .eq('email', roommate.email.toLowerCase().trim())
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing roommate:', checkError);
        throw checkError;
      }

      if (existingRoommate) {
        console.log('⚠️ DUPLICATE FOUND - Roommate already exists');
        toast({
          title: "Already Added",
          description: "This roommate has already been added to your list.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ STEP 2 COMPLETE - No duplicates found');
      console.log('🚀 STEP 3: CREATING BIDIRECTIONAL RELATIONSHIP');

      // Create bidirectional roommate relationship
      await createBidirectionalRoommateRelation(user, roommate.email, roommate);

      console.log('🎉 SUCCESS! Roommate relationship created successfully');
      
      // Refresh the roommates list
      await fetchRoommates(); 
      
      toast({
        title: "🎉 Success!",
        description: `${roommate.name} has been added to your roommate group! Both of you can now see each other as roommates.`,
      });
      
    } catch (error: any) {
      console.error('💥 CRITICAL ERROR in addRoommate function:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      toast({
        title: "Addition Failed",
        description: `Could not add roommate: ${error.message || 'Unknown error occurred'}`,
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
      
      await fetchRoommates();
      
      toast({
        title: "Roommate Removed",
        description: `Roommate has been removed from your group`,
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

  const deleteAllMyRoommates = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return;
    }
    try {
      console.log('Deleting all roommates for user:', user.id);
      const { error } = await supabase
        .from('roommates')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase delete all roommates error:', error);
        throw error;
      }
      
      await fetchRoommates();
      
      toast({
        title: "All Roommates Removed",
        description: `All roommates you added have been removed.`,
      });
    } catch (error: any) {
      console.error('Error deleting all roommates:', error);
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
