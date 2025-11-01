import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('OneSignal notification function called');

  try {
    const { title, message, data } = await req.json();
    console.log('Received notification request:', { title, message, data });

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    console.log('OneSignal App ID configured:', !!ONESIGNAL_APP_ID);
    console.log('OneSignal API Key configured:', !!ONESIGNAL_REST_API_KEY);

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured');
    }

    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Subscribed Users'],
      headings: { en: title },
      contents: { en: message },
      data: data || {},
    };

    console.log('Sending notification to OneSignal:', notificationPayload);

    // Send notification to all subscribed users
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();
    console.log('OneSignal API response:', result);

    if (!response.ok) {
      console.error('OneSignal API error response:', result);
      throw new Error(`OneSignal API error: ${JSON.stringify(result)}`);
    }

    console.log('Notification sent successfully');
    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error sending OneSignal notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
