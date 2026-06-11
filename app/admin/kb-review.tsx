import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { PillInput } from "../../components/ui/PillInput";
import { Sheet } from "../../components/ui/Sheet";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { kbApi, type KbCandidate } from "../../lib/api/kb";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function KbReviewScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<KbCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<KbCandidate | null>(null);

  const load = async () => {
    try {
      setItems(await kbApi.listPending());
    } catch (e) {
      console.warn("[KbReview] load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="지식베이스 검수"
        serif={false}
      />

      {loading ? null : items.length === 0 ? (
        <EmptyState
          icon="📚"
          title="검수할 후보가 없어요"
          description={"수련생이 선생님 답변에 '도움됐어요'를 누르면 후보로 모입니다."}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((c) => (
            <View key={c.id} style={styles.card}>
              <Text style={styles.count}>👍 {c.helpful_count}</Text>
              {c.question_body ? (
                <Text style={styles.q} numberOfLines={2}>
                  Q. {c.question_body}
                </Text>
              ) : null}
              <Text style={styles.a} numberOfLines={4}>
                {c.message_body ?? "(원문 없음)"}
              </Text>
              <Button
                title="검토"
                variant="outline"
                size="small"
                onPress={() => setActive(c)}
                style={{ marginTop: SPACING.sm, alignSelf: "flex-start" }}
              />
            </View>
          ))}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}

      <ReviewSheet
        candidate={active}
        onClose={() => setActive(null)}
        onDone={(id) => {
          removeItem(id);
          setActive(null);
        }}
      />
    </SafeAreaView>
  );
}

function ReviewSheet({
  candidate,
  onClose,
  onDone,
}: {
  candidate: KbCandidate | null;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [safety, setSafety] = useState(false);
  const [drop, setDrop] = useState(false);
  const [distilling, setDistilling] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle("");
    setContent("");
    setSafety(false);
    setDrop(false);
  }, [candidate?.id]);

  if (!candidate) return null;

  const distill = async () => {
    setDistilling(true);
    try {
      const res = await kbApi.distill(candidate.message_id);
      setTitle(res.title);
      setContent(res.content);
      setSafety(res.safety);
      setDrop(res.drop);
    } catch (e: any) {
      Alert.alert("초안 생성 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setDistilling(false);
    }
  };

  const approve = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("입력 확인", "제목과 내용을 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      await kbApi.approve({
        candidateId: candidate.id,
        messageId: candidate.message_id,
        studioId: candidate.studio_id,
        title: title.trim(),
        content: content.trim(),
        safety,
      });
      onDone(candidate.id);
    } catch (e: any) {
      Alert.alert("적재 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await kbApi.reject(candidate.id);
      onDone(candidate.id);
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={!!candidate} onClose={onClose} title="후보 검토">
      {candidate.question_body ? (
        <Text style={styles.sheetQ}>Q. {candidate.question_body}</Text>
      ) : null}
      <Text style={styles.sheetA}>{candidate.message_body}</Text>

      <Button
        title={distilling ? "초안 생성 중…" : "익명 초안 생성"}
        variant="outline"
        onPress={distill}
        loading={distilling}
        style={{ marginTop: SPACING.md }}
      />

      {drop ? (
        <Text style={styles.dropWarn}>
          ⚠️ 일반화 가치가 낮거나 부적합할 수 있는 답변이에요. 적재를 권장하지
          않습니다.
        </Text>
      ) : null}
      {safety ? (
        <Text style={styles.safetyWarn}>
          ⚠️ 안전 민감(통증/부상/임신 등) 주제 — 적재 시 신중히 검토하세요.
        </Text>
      ) : null}

      <View style={{ height: SPACING.md }} />
      <PillInput
        label="제목"
        value={title}
        onChangeText={setTitle}
        placeholder="초안 생성 후 수정하세요"
      />
      <PillInput
        label="내용"
        value={content}
        onChangeText={setContent}
        placeholder="익명·일반화된 지식 내용"
        multiline
      />

      <View style={styles.actions}>
        <Button
          title="거절"
          variant="destructive"
          onPress={reject}
          disabled={busy}
          style={{ flex: 1 }}
        />
        <Button
          title="승인·적재"
          onPress={approve}
          loading={busy}
          disabled={busy || !title.trim() || !content.trim()}
          style={{ flex: 1 }}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  count: { color: COLORS.primary, fontSize: 12, fontWeight: "800", marginBottom: 6 },
  q: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 4 },
  a: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  sheetQ: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 },
  sheetA: { color: COLORS.text, fontSize: 14, lineHeight: 21 },
  dropWarn: { color: COLORS.warning, fontSize: 12, marginTop: 10, lineHeight: 17 },
  safetyWarn: { color: COLORS.error, fontSize: 12, marginTop: 8, lineHeight: 17 },
  actions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.md },
});
