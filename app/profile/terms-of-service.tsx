import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { LegalMarkdown } from "../../components/LegalMarkdown";
import { legalAPI } from "../../lib/api/legal";

// 이용약관 — legal_documents(doc_key=terms_of_service)에서 조회.
// 소스 하드코딩을 제거하고 서버 최신 문구를 렌더한다(BO에서 편집).
export default function TermsOfServiceScreen() {
  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    legalAPI.getDoc("terms_of_service").then((d) => {
      if (!alive) return;
      setBody(d?.body ?? null);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loading} />
        ) : body ? (
          <LegalMarkdown body={body} />
        ) : (
          <Text style={styles.fallback}>
            문서를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 100,
  },
  loading: {
    marginTop: 48,
  },
  fallback: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 48,
    textAlign: "center",
  },
});
