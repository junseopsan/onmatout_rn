// supabase/functions/send-push/index.ts
//
// 입력: POST { user_id, title, body, data?: object }
// 동작: 해당 user_id 의 모든 user_push_tokens 에 Expo Push API 로 전송.
// 인증: verify_jwt: false (pg_net 트리거에서 호출). 외부 호출 차단 위해 origin 체크는 추후.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN") ?? ""; // 선택

const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...cors() },
    });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("env missing");
    }

    const body = await req.json();
    const userId: string | undefined = body?.user_id;
    const title: string = body?.title ?? "";
    const messageBody: string = body?.body ?? "";
    const data = body?.data ?? {};

    if (!userId || (!title && !messageBody)) {
      return new Response(
        JSON.stringify({ error: "user_id + title|body required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors() } },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: tokens, error } = await admin
      .from("user_push_tokens")
      .select("token, platform")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    const list = (tokens ?? []).filter((t) => typeof t.token === "string" && t.token.length > 0);
    if (list.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: "no tokens" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...cors() },
      });
    }

    // Expo Push API — 한 번에 최대 100개
    const messages = list.map((t) => ({
      to: t.token,
      sound: "default",
      title,
      body: messageBody,
      data,
    }));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-encoding": "gzip, deflate",
    };
    if (EXPO_ACCESS_TOKEN) headers["Authorization"] = `Bearer ${EXPO_ACCESS_TOKEN}`;

    const r = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(messages),
    });
    const expoResult = await r.json().catch(() => ({}));

    if (!r.ok) {
      console.warn("expo push api error:", r.status, expoResult);
    }

    return new Response(JSON.stringify({ sent: messages.length, expo: expoResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...cors() },
    });
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json", ...cors() } },
    );
  }
});
