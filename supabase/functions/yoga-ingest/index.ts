// supabase/functions/yoga-ingest/index.ts
//
// 어드민 전용 — 문서를 받아 임베딩 후 knowledge_documents 에 저장.
//
// 입력: POST { source_type: string, source_id?: uuid, title: string, content: string, metadata?: object }
//      Authorization: Bearer <admin JWT>
//
// 출력: { id }
//
// 필요 env: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIM = 1536;
const MAX_CONTENT = 8000; // embedding 한 번에 보낼 수 있는 안전 길이 (대략)

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function embed(text: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!r.ok) {
    throw new Error(`embedding failed (${r.status}): ${await r.text()}`);
  }
  const j = await r.json();
  const v = j?.data?.[0]?.embedding;
  if (!Array.isArray(v) || v.length !== EMBED_DIM) {
    throw new Error(`unexpected embedding shape`);
  }
  return v;
}

serve(async (req) => {
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

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
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

    // 어드민 확인
    const { data: adminRow, error: adminErr } = await authClient
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (adminErr || !adminRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const body = await req.json();
    const sourceType = (body?.source_type ?? "").toString();
    const sourceId = body?.source_id ?? null;
    const title = (body?.title ?? "").toString().trim();
    const content = (body?.content ?? "").toString().trim();
    const metadata = body?.metadata ?? {};

    if (!sourceType || !title || !content) {
      return new Response(
        JSON.stringify({ error: "source_type, title, content 필수" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        },
      );
    }
    if (content.length > MAX_CONTENT) {
      return new Response(
        JSON.stringify({
          error: `content 너무 깁니다 (최대 ${MAX_CONTENT}자). 분할해서 ingest 하세요.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        },
      );
    }

    // 임베딩
    const vec = await embed(`${title}\n\n${content}`);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error: insErr } = await adminClient
      .from("knowledge_documents")
      .insert({
        source_type: sourceType,
        source_id: sourceId,
        title,
        content,
        metadata,
        embedding: vec,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    return new Response(JSON.stringify({ id: row.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (e) {
    console.error("yoga-ingest error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      },
    );
  }
});
