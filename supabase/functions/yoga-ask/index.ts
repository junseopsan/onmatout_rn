// supabase/functions/yoga-ask/index.ts
//
// RAG endpoint — 사용자 질문을 받아 임베딩 → pgvector 검색 → GPT-4o-mini 답변 → 로깅
//
// 입력: POST { question: string, thread_id?: string, source_types?: string[] }
//      Authorization: Bearer <user JWT>
//
// 출력: { answer, sources, safety_notice_required, should_recommend_teacher, log_id }
//
// 필요 env: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          SUPABASE_ANON_KEY (선택)
//
// 모델: Embedding = text-embedding-3-small (1536-dim)
//      LLM       = gpt-4o-mini

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIM = 1536;
const LLM_MODEL = "gpt-4o-mini";
const MAX_TOKENS = 800;
const MATCH_THRESHOLD = 0.3;
const MATCH_COUNT = 6;

const SAFETY_KEYWORDS = [
  "통증",
  "아파",
  "아픔",
  "다쳤",
  "부상",
  "수술",
  "임신",
  "임산부",
  "고혈압",
  "디스크",
  "허리",
  "무릎",
  "어깨",
  "병원",
  "약",
];

const SYSTEM_PROMPT = `당신은 ONMATOUT 의 요가 학습 도우미입니다. 한국 사용자에게 한국어로 답하세요.
반드시 검색 결과 (CONTEXT) 만 근거로 답하세요. CONTEXT 에 없는 내용은 솔직히 "모르겠다" 고 말하세요.

답변 가이드:
- 친절하고 차분한 톤. 짧은 단락 1~3개.
- 출처는 UI 에서 자동으로 칩으로 표시되므로 본문에 [출처: ...] 같은 인용 표기를 절대 넣지 마세요.
- 통증/부상/임신/만성질환 관련 질문이면 의학적 판단을 하지 말고 "지도자나 의료진과 상담" 을 권유하세요.
- 자세 안내가 위험할 수 있다면 안전 주의문을 짧게 덧붙이세요.
- 마케팅·과장 금지.`;

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
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: text,
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`embedding failed (${r.status}): ${err}`);
  }
  const j = await r.json();
  const v = j?.data?.[0]?.embedding;
  if (!Array.isArray(v) || v.length !== EMBED_DIM) {
    throw new Error(`unexpected embedding shape: len=${v?.length}`);
  }
  return v;
}

type RetrievedDoc = {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_id: string;
  similarity: number;
};

async function generateAnswer(
  question: string,
  docs: RetrievedDoc[],
): Promise<string> {
  const context = docs
    .map((d, i) => `[${i + 1}] ${d.title}\n${d.content}`)
    .join("\n\n---\n\n");

  const userContent = `QUESTION:\n${question}\n\nCONTEXT:\n${context || "(검색 결과 없음)"}`;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`llm failed (${r.status}): ${err}`);
  }
  const j = await r.json();
  const text = j?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("empty answer");
  return text;
}

function detectSafetyFlags(question: string, answer: string) {
  const blob = (question + " " + answer).toLowerCase();
  const matched = SAFETY_KEYWORDS.some((k) => blob.includes(k));
  return {
    safety_notice_required: matched,
    should_recommend_teacher: matched,
  };
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
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.",
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // 사용자 토큰으로 인증된 사용자 조회
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const question = (body?.question ?? "").toString().trim();
    const threadId = body?.thread_id ?? null;
    const sourceTypes: string[] | null = Array.isArray(body?.source_types)
      ? body.source_types
      : null;

    if (!question) {
      return new Response(JSON.stringify({ error: "question required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
    if (question.length > 1000) {
      return new Response(
        JSON.stringify({ error: "question too long (max 1000)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        },
      );
    }

    // service role 로 DB 호출 (RPC + INSERT)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) 임베딩
    const queryEmbedding = await embed(question);

    // 2) 매칭 검색
    const { data: matches, error: matchErr } = await adminClient.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: MATCH_THRESHOLD,
        match_count: MATCH_COUNT,
        filter_source_types: sourceTypes,
      },
    );
    if (matchErr) throw new Error(`match_documents: ${matchErr.message}`);

    const docs = (matches ?? []) as RetrievedDoc[];

    // 3) Claude 답변
    const answer = await generateAnswer(question, docs);

    // 4) 안전 플래그
    const flags = detectSafetyFlags(question, answer);

    // 5) 로깅
    const { data: logRow, error: logErr } = await adminClient
      .from("ai_answer_logs")
      .insert({
        user_id: userId,
        thread_id: threadId,
        question,
        answer,
        retrieved_document_ids: docs.map((d) => d.id),
        related_asana_ids: docs
          .filter((d) => d.source_type === "asana")
          .map((d) => d.source_id),
        related_routine_ids: docs
          .filter((d) => d.source_type === "routine")
          .map((d) => d.source_id),
        safety_notice_required: flags.safety_notice_required,
        should_recommend_teacher: flags.should_recommend_teacher,
      })
      .select("id")
      .single();
    if (logErr) {
      // 로깅 실패해도 답변은 반환
      console.warn("ai_answer_logs insert failed:", logErr.message);
    }

    return new Response(
      JSON.stringify({
        answer,
        sources: docs.map((d) => ({
          id: d.id,
          title: d.title,
          source_type: d.source_type,
          similarity: d.similarity,
        })),
        safety_notice_required: flags.safety_notice_required,
        should_recommend_teacher: flags.should_recommend_teacher,
        log_id: logRow?.id ?? null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      },
    );
  } catch (e) {
    console.error("yoga-ask error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      },
    );
  }
});
