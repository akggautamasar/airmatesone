
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Database {
  public: {
    Tables: {
      notification_reminders: {
        Row: {
          id: string;
          expense_id: string;
          debtor_user_id: string;
          creditor_user_id: string;
          settlement_id: string | null;
          reminder_sent_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          description: string;
          amount: number;
          user_id: string;
          sharers: string[] | null;
          created_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string | null;
          upi_id: string | null;
        };
      };
      notifications: {
        Insert: {
          user_id: string;
          title: string;
          message: string;
          type: string;
          expense_id?: string;
        };
      };
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

    // Find reminders that are 24+ hours old and haven't been sent yet
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: reminders, error: remindersError } = await supabase
      .from('notification_reminders')
      .select(`
        *,
        expenses!inner(id, description, amount),
        profiles!notification_reminders_creditor_user_id_fkey(name, upi_id)
      `)
      .eq('is_active', true)
      .is('reminder_sent_at', null)
      .lte('created_at', twentyFourHoursAgo.toISOString());

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    console.log(`Found ${reminders?.length || 0} reminders to process`);

    for (const reminder of reminders || []) {
      try {
        // Get expense details
        const { data: expense } = await supabase
          .from('expenses')
          .select('description, amount, sharers')
          .eq('id', reminder.expense_id)
          .single();

        // Get creditor profile
        const { data: creditorProfile } = await supabase
          .from('profiles')
          .select('name, upi_id')
          .eq('id', reminder.creditor_user_id)
          .single();

        if (!expense || !creditorProfile) {
          console.log(`Skipping reminder ${reminder.id} - missing expense or creditor data`);
          continue;
        }

        // Calculate the amount owed by this specific debtor
        const numSharers = expense.sharers?.length || 1;
        const amountOwed = expense.amount / numSharers;

        // Create reminder notification
        const reminderMessage = `⏰ Reminder: You still owe ₹${amountOwed.toFixed(2)} to ${creditorProfile.name || 'Unknown'} for ${expense.description}. Please settle it soon.`;

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: reminder.debtor_user_id,
            title: 'Payment Reminder',
            message: reminderMessage,
            type: 'reminder',
            expense_id: reminder.expense_id
          });

        if (notificationError) {
          console.error(`Error creating notification for reminder ${reminder.id}:`, notificationError);
          continue;
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('notification_reminders')
          .update({ 
            reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', reminder.id);

        if (updateError) {
          console.error(`Error updating reminder ${reminder.id}:`, updateError);
        } else {
          console.log(`Sent reminder for expense ${reminder.expense_id} to user ${reminder.debtor_user_id}`);
        }

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedCount: reminders?.length || 0,
        message: `Processed ${reminders?.length || 0} reminders`
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-reminder-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
