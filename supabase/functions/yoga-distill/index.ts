// supabase/functions/yoga-distill/index.ts
//
// 어드민 전용 — 채팅의 선생님 답변(👍 받은 후보)을 익명·일반화한 지식베이스 초안으로 변환.
// 실제 적재는 하지 않음 (어드민이 검토 후 yoga-ingest로 적재).
//
// 입력: POST { message_id: uuid }   Authorization: Bearer <admin JWT>
// 출력: { title, content, safety, drop }
//
// 필요 env: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const LLM_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `당신은 요가 지식베이스 큐레이터입니다.
선생님이 수련생에게 한 답변(과 질문 맥락)을 받아, 다른 사람에게도 도움이 되도록
"익명화 + 일반화"한 지식 항목으로 변환하세요. 한국어.

규칙:
- 개인정보(이름, 연락처, 특정 인물/날짜/장소 등)와 특정 개인 상황은 모두 제거하고 일반화하세요.
- 사실 그대로만. 답변에 없는 내용을 지어내지 마세요.
- 의료/부상/통증/임신/만성질환 등 안전이 민감한 주제면 safety=true.
- 일반화해도 지식으로서 가치가 없거나(잡담/일정조율 등) 위험하면 drop=true.
- title: 검색에 도움되는 짧은 질문형 제목. content: 1~3개 짧은 단락의 일반화된 조언.

반드시 아래 JSON만 출력:
{"title": string, "content": string, "safety": boolean, "drop": boolean}`;

const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  try {
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("필수 env 누락");
    }

    const token = (req.headers.get("Authorization") ?? "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const authClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: adminRow } = await admin
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const body = await req.json();
    const messageId = (body?.message_id ?? "").toString();
    if (!messageId) {
      return new Response(JSON.stringify({ error: "message_id 필수" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // 선생님 답변 + 직전 수련생 질문(맥락)
    const { data: msg } = await admin
      .from("chat_messages")
      .select("id, room_id, body, created_at, sender_role")
      .eq("id", messageId)
      .maybeSingle();
    if (!msg) {
      return new Response(JSON.stringify({ error: "message not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const { data: prevQ } = await admin
      .from("chat_messages")
      .select("body")
      .eq("room_id", msg.room_id)
      .eq("sender_role", "student")
      .lt("created_at", msg.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const userContent = `질문(맥락):\n${prevQ?.body ?? "(없음)"}\n\n선생님 답변:\n${msg.body}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });
    if (!r.ok) {
      throw new Error(`llm failed (${r.status}): ${await r.text()}`);
    }
    const j = await r.json();
    const raw = j?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("distill JSON 파싱 실패");
    }

    return new Response(
      JSON.stringify({
        title: (parsed.title ?? "").toString(),
        content: (parsed.content ?? "").toString(),
        safety: !!parsed.safety,
        drop: !!parsed.drop,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } },
    );
  }
});
