
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format, parseISO, differenceInDays } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Chore {
  id: string;
  name: string;
  participants: string[] | null;
  assignment_type: string;
  weekly_schedule: { [key: string]: string } | null;
  start_date: string;
  reminder_time: string | null;
  last_reminder_sent_date: string | null;
}

interface Profile {
  id: string;
  email: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Get current date and time information
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm:ss");

    // 2. Fetch all chores that haven't had a reminder sent today
    const { data: chores, error: choresError } = await supabase
      .from('chores')
      .select('*')
      .or(`last_reminder_sent_date.is.null,last_reminder_sent_date.neq.${today}`)
      .lte('reminder_time', currentTime);

    if (choresError) throw choresError;

    if (!chores || chores.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No chores to remind for at this time." }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3. Fetch all user profiles to map emails to IDs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email');
    
    if (profilesError) throw profilesError;
    const emailToIdMap = new Map(profiles?.map(p => [p.email, p.id]));

    let remindersSent = 0;

    for (const chore of chores) {
      try {
        // 4. Determine who is assigned today
        let assignedEmail: string | null = null;

        if (!chore.participants || chore.participants.length === 0) continue;

        if (chore.assignment_type === 'weekly_rotation') {
          if (!chore.weekly_schedule) continue;
          const dayOfWeek = format(now, 'eeee').toLowerCase();
          const schedule = chore.weekly_schedule as { [key: string]: string };
          assignedEmail = schedule[dayOfWeek] || null;
        } else { // daily_rotation
          const startDate = parseISO(chore.start_date);
          const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const daysSinceStart = differenceInDays(todayDateOnly, startDate);

          if (daysSinceStart < 0) continue;

          const assignedIndex = daysSinceStart % chore.participants.length;
          assignedEmail = chore.participants[assignedIndex];
        }

        if (!assignedEmail || assignedEmail === 'unassigned') continue;

        // 5. Get assigned user's ID
        const assignedUserId = emailToIdMap.get(assignedEmail);
        if (!assignedUserId) continue;

        // 6. Send notification
        const reminderMessage = `⏰ Reminder: You have to do the chore "${chore.name}" today!`;
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: assignedUserId,
            title: 'Chore Reminder',
            message: reminderMessage,
            type: 'chore_reminder',
          });
        
        if (notificationError) {
          console.error(`Error creating notification for chore ${chore.id}:`, notificationError);
          continue;
        }

        // 7. Update the last_reminder_sent_date for the chore
        const { error: updateError } = await supabase
          .from('chores')
          .update({ last_reminder_sent_date: today })
          .eq('id', chore.id);

        if (updateError) {
          console.error(`Error updating chore ${chore.id}:`, updateError);
        } else {
          remindersSent++;
          console.log(`Sent reminder for chore "${chore.name}" to ${assignedEmail}`);
        }
      } catch(e) {
        console.error(`Error processing chore ${chore.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, message: `Processed ${chores.length} chores and sent ${remindersSent} reminders.` }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-chore-reminders function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
