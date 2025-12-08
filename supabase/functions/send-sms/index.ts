// supabase/functions/send-sms/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import CryptoJS from "https://esm.sh/crypto-js@4.2.0";

interface SmsHookPayload {
  user: { phone: string };
  sms: { otp: string };
}

function makeSensSignature({
  method,
  urlPath,
  timestamp,
  accessKey,
  secretKey,
}: {
  method: string;
  urlPath: string;
  timestamp: string;
  accessKey: string;
  secretKey: string;
}) {
  const space = " ";
  const newLine = "\n";

  const message = [
    method,
    space,
    urlPath,
    newLine,
    timestamp,
    newLine,
    accessKey,
  ].join("");

  const hmac = CryptoJS.HmacSHA256(message, secretKey);
  return CryptoJS.enc.Base64.stringify(hmac);
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const payload = (await req.json()) as SmsHookPayload;

    const phone = payload.user?.phone;
    const otp = payload.sms?.otp;

    if (!phone || !otp) {
      console.error("Invalid payload:", payload);
      return new Response("Bad Request", { status: 400 });
    }

    // 환경변수에서 SENS 설정 가져오기
    const serviceId = Deno.env.get("NCP_SENS_SERVICE_ID");
    const accessKey = Deno.env.get("NCP_SENS_ACCESS_KEY");
    const secretKey = Deno.env.get("NCP_SENS_SECRET_KEY");
    const from = Deno.env.get("NCP_SENS_FROM"); // 발신번호

    if (!serviceId || !accessKey || !secretKey || !from) {
      console.error("Missing SENS env vars");
      return new Response("Server Misconfigured", { status: 500 });
    }

    const timestamp = Date.now().toString();
    const method = "POST";
    const urlPath = `/sms/v2/services/${serviceId}/messages`;
    const signature = makeSensSignature({
      method,
      urlPath,
      timestamp,
      accessKey,
      secretKey,
    });

    const sensUrl = `https://sens.apigw.ntruss.com/sms/v2/services/${serviceId}/messages`;

    const content = `[OnMatOut] 인증번호는 ${otp} 입니다.`; // 실제 발송 메시지 포맷

    const sensRes = await fetch(sensUrl, {
      method,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-ncp-apigw-timestamp": timestamp,
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-signature-v2": signature,
      },
      body: JSON.stringify({
        type: "SMS",
        from,
        content,
        messages: [{ to: phone }],
      }),
    });

    if (!sensRes.ok) {
      const errText = await sensRes.text();
      console.error("SENS error:", sensRes.status, errText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "SENS_ERROR",
          detail: errText,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Supabase Auth 입장에서는 2xx + JSON 응답이면 성공으로 처리
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-sms function error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
