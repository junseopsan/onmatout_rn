import { supabase } from "../supabase";

// 약관·정책 문서(legal_documents) 조회.
// doc_key: privacy_policy | terms_of_service | account_deletion
// 소스 하드코딩 대신 서버에서 최신 문구를 받아온다(BO에서 편집).

export type LegalDoc = {
  title: string;
  body: string; // 마크다운
  version: number;
  effective_date: string | null;
};

export const legalAPI = {
  getDoc: async (docKey: string): Promise<LegalDoc | null> => {
    const { data, error } = await supabase
      .from("legal_documents")
      .select("title, body, version, effective_date")
      .eq("doc_key", docKey)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as LegalDoc;
  },
};
