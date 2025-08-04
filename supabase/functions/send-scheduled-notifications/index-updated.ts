/// <reference path="./types.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// 📤 Send OneSignal Notification
async function sendOneSignalWebPush(userId: string, userEmail: string, message: string) {
  const appId = Deno.env.get("ONESIGNAL_APP_ID");
  const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");

  if (!appId || !apiKey) {
    console.error("⚠️ OneSignal credentials missing");
    return { success: false, error: "Missing OneSignal credentials" };
  }

  const personalizedMessage = `Hello, ${userEmail}! ${message}`;

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
      include_external_user_ids: [userId],
      headings: { en: "🌟 Your Daily Motivation" },
      contents: { en: personalizedMessage },
      web_url: "https://localhost:8080",
      priority: 10,
      ttl: 86400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ OneSignal error:", errorText);
    return { success: false, error: errorText };
  }

  const result = await response.json();
  return result.recipients > 0
    ? {
        success: true,
        recipients: result.recipients,
        notificationId: result.id,
        details: `Sent to ${result.recipients} recipients`,
      }
    : { success: false, error: "No recipients" };
}

// ⏰ Time Check
function isNotificationTime(userTimezone: string, userNotificationTime: string) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: userTimezone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const currentHour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const currentMinute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");

    const [prefHour, prefMinute] = userNotificationTime.split(":").map((v) => parseInt(v, 10));
    const timeDiff = currentHour * 60 + currentMinute - (prefHour * 60 + prefMinute);
    return timeDiff === 0;
  } catch (error) {
    console.error("❌ Time check failed:", error);
    return false;
  }
}

// 🚀 Main Edge Function
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { data: users, error: usersError } = await supabase
      .from("customer_users")
      .select("id, email, name, notification_enabled, notification_time, timezone")
      .eq("notification_enabled", true);

    if (usersError) throw usersError;
    if (!users?.length) {
      return new Response(JSON.stringify({ success: true, message: "No users to notify", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: messages, error: messagesError } = await supabase
      .from("motivational_messages")
      .select("id, content, category")
      .eq("status", "active");

    if (messagesError) throw messagesError;
    if (!messages?.length) {
      return new Response(JSON.stringify({ success: false, message: "No active messages", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    let processedCount = 0;

    for (const user of users) {
      console.log(`⏰ Checking ${user.email} — Timezone: ${user.timezone}, Pref Time: ${user.notification_time}`);

      if (!isNotificationTime(user.timezone, user.notification_time)) {
        console.log(`⏭️ Skipping ${user.email} — not their notification time`);
        continue;
      }

      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      if (!randomMessage?.id) {
        console.warn("⚠️ No valid message selected for user:", user.email);
        continue;
      }

      console.log(`🔔 Sending to ${user.email} — Message ID: ${randomMessage.id}`);
      const notificationResult = await sendOneSignalWebPush(user.id, user.email, randomMessage.content);

      let historyRecorded = false;
      let historyError = null;

      if (notificationResult.success && notificationResult.recipients && notificationResult.recipients > 0) {
        const historyRecord = {
          customer_id: user.id,
          message_id: randomMessage.id,
          sent_at: new Date().toISOString(),
        };

        console.log("📦 Inserting history record:", historyRecord);

        try {
          const { data, error } = await supabase
            .from("user_message_history")
            .insert(historyRecord)
            .select("*");

          if (error) {
            console.error(`❌ Insert failed for ${user.email}:`, {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
            historyError = error.message;
          } else {
            console.log(`✅ Inserted successfully for ${user.email}`, data);
            historyRecorded = true;
          }
        } catch (err) {
          console.error(`💥 Insert exception for ${user.email}:`, err);
          historyError = err.message;
        }
      } else {
        console.warn(`⚠️ Notification skipped/failed for ${user.email}:`, notificationResult.error);
      }

      results.push({
        userId: user.id,
        userEmail: user.email,
        messageId: randomMessage.id,
        success: notificationResult.success,
        recipients: notificationResult.recipients || 0,
        historyRecorded,
        error: notificationResult.error || historyError || undefined,
      });

      processedCount++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedCount} users`,
        processed: processedCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Fatal error: ${error.message || error}`,
        processed: 0,
        results: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
