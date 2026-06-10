import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { Loading } from "../../components/ui/Loading";
import { PillInput } from "../../components/ui/PillInput";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { Sheet } from "../../components/ui/Sheet";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { pivotStudioApi } from "../../lib/api/pivotStudio";
import { storageAPI } from "../../lib/api/storage";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherStudioForm">;

type ImageKind = "description" | "policy" | "pricing";

// 월~일 순서 (key는 0=일 .. 6=토)
const DAYS: { key: string; label: string }[] = [
  { key: "1", label: "월" },
  { key: "2", label: "화" },
  { key: "3", label: "수" },
  { key: "4", label: "목" },
  { key: "5", label: "금" },
  { key: "6", label: "토" },
  { key: "0", label: "일" },
];

const MAX_PHOTOS = 10;

type DayHours = { open?: string; close?: string; closed?: boolean };

// 30분 단위 시간 목록
const TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function parseDayHours(v?: string): DayHours {
  if (!v) return {};
  if (v === "휴무") return { closed: true };
  const [o, c] = v.split("-");
  return { open: o || undefined, close: c || undefined };
}

function serializeDayHours(d: DayHours): string | null {
  if (d.closed) return "휴무";
  if (d.open && d.close) return `${d.open}-${d.close}`;
  return null;
}

// 토=파랑, 일=빨강, 평일=뮤트
function dayColor(key: string): string | null {
  if (key === "6") return COLORS.info;
  if (key === "0") return COLORS.error;
  return null;
}

export default function TeacherStudioFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { studioId } = route.params ?? { studioId: undefined };
  const editing = !!studioId;
  const { createStudio, updateStudioLocal, setActiveStudio, reloadStudios } =
    usePivotStudios();
  const { user } = useAuth();

  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [kakao, setKakao] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [hours, setHours] = useState<Record<string, DayHours>>({});
  const [picker, setPicker] = useState<{
    key: string;
    which: "open" | "close";
  } | null>(null);
  const [description, setDescription] = useState("");
  const [policy, setPolicy] = useState("");
  const [pricing, setPricing] = useState("");
  const [cancelCutoff, setCancelCutoff] = useState(0);

  const [photos, setPhotos] = useState<string[]>([]);
  const [descriptionImage, setDescriptionImage] = useState<string | null>(null);
  const [policyImage, setPolicyImage] = useState<string | null>(null);
  const [pricingImage, setPricingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<ImageKind | "gallery" | null>(null);

  useEffect(() => {
    if (!editing || !studioId) return;
    let mounted = true;
    (async () => {
      try {
        const s = await pivotStudioApi.getStudio(studioId);
        if (mounted && s) {
          setName(s.name);
          setLocation(s.location ?? "");
          setPhone(s.phone ?? "");
          setWebsite(s.website_url ?? "");
          setInstagram(s.instagram_url ?? "");
          setKakao(s.kakao_url ?? "");
          setBankAccount(s.bank_account ?? "");
          const hb = s.hours_by_day ?? {};
          const parsed: Record<string, DayHours> = {};
          for (const d of DAYS) parsed[d.key] = parseDayHours(hb[d.key]);
          setHours(parsed);
          setDescription(s.description ?? "");
          setPolicy(s.policy_text ?? "");
          setPricing(s.pricing_text ?? "");
          setCancelCutoff(s.cancel_cutoff_hours ?? 0);
          setPhotos(s.photos ?? []);
          setDescriptionImage(s.description_image_url ?? null);
          setPolicyImage(s.policy_image_url ?? null);
          setPricingImage(s.pricing_image_url ?? null);
        }
      } catch (e) {
        console.warn("[StudioForm] load failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editing, studioId]);

  const canSubmit = name.trim().length > 0 && !submitting;

  const setterFor = (kind: ImageKind) =>
    ({
      description: setDescriptionImage,
      policy: setPolicyImage,
      pricing: setPricingImage,
    })[kind];

  const pickSingle = async (kind: ImageKind) => {
    if (!user?.id) return Alert.alert("로그인이 필요해요");
    setUploading(kind);
    try {
      const res = await storageAPI.uploadStudioImage(user.id);
      if (res.success && res.url) setterFor(kind)(res.url);
      else if (!res.canceled)
        Alert.alert("업로드 실패", res.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setUploading(null);
    }
  };

  const pickGallery = async () => {
    if (!user?.id) return Alert.alert("로그인이 필요해요");
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0)
      return Alert.alert(`대표 사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있어요.`);
    setUploading("gallery");
    try {
      const res = await storageAPI.uploadStudioPhotos(user.id, remaining);
      if (res.success && res.urls)
        setPhotos((prev) => [...prev, ...res.urls!].slice(0, MAX_PHOTOS));
      else if (!res.canceled)
        Alert.alert("업로드 실패", res.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setUploading(null);
    }
  };

  const updateDay = (key: string, patch: DayHours) =>
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const hb: Record<string, string> = {};
      for (const d of DAYS) {
        const v = serializeDayHours(hours[d.key] ?? {});
        if (v) hb[d.key] = v;
      }
      const payload = {
        name: name.trim(),
        location: location.trim() || null,
        phone: phone.trim() || null,
        website_url: website.trim() || null,
        instagram_url: instagram.trim() || null,
        kakao_url: kakao.trim() || null,
        bank_account: bankAccount.trim() || null,
        hours_by_day: Object.keys(hb).length ? hb : null,
        description: description.trim() || null,
        policy_text: policy.trim() || null,
        pricing_text: pricing.trim() || null,
        photos,
        description_image_url: descriptionImage,
        rules_image_url: null,
        policy_image_url: policyImage,
        pricing_image_url: pricingImage,
        cancel_cutoff_hours: cancelCutoff,
      };
      if (editing && studioId) {
        const updated = await pivotStudioApi.updateStudio(studioId, payload);
        updateStudioLocal(updated);
        Alert.alert("저장 완료", "요가원 정보를 업데이트했어요.");
        navigation.goBack();
      } else {
        const created = await createStudio(payload);
        if (created) {
          await setActiveStudio(created);
          await reloadStudios();
          Alert.alert(
            "요가원 추가 완료",
            `${created.name} 으로 활성 요가원을 전환했어요.`,
          );
          navigation.goBack();
        }
      }
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader
          onBack={() => navigation.goBack()}
          title={editing ? "요가원 정보" : "새 요가원"}
        />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={editing ? "요가원 정보" : "새 요가원"}
        trailing={{
          kind: "text",
          label: submitting ? "저장 중…" : "저장",
          tone: "primary",
          onPress: handleSubmit,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 대표 사진 */}
          <SectionLabel>대표 사진</SectionLabel>
          <PhotoGallery
            photos={photos}
            uploading={uploading === "gallery"}
            onAdd={pickGallery}
            onRemove={(url) =>
              setPhotos((prev) => prev.filter((u) => u !== url))
            }
          />

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>기본 정보</SectionLabel>
          <PillInput
            label="상호명"
            required
            placeholder="상호명을 입력해주세요"
            value={name}
            onChangeText={setName}
          />
          <PillInput
            label="주소"
            placeholder="주소를 입력해주세요"
            value={location}
            onChangeText={setLocation}
          />
          <PillInput
            label="연락처"
            placeholder="연락처를 입력해주세요"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <PillInput
            label="홈페이지"
            placeholder="홈페이지 주소를 입력해주세요"
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            keyboardType="url"
          />
          <PillInput
            label="인스타그램"
            placeholder="인스타그램 주소를 입력해주세요"
            value={instagram}
            onChangeText={setInstagram}
            autoCapitalize="none"
            keyboardType="url"
          />
          <PillInput
            label="카카오톡 문의"
            placeholder="카카오톡 문의 링크를 입력해주세요"
            value={kakao}
            onChangeText={setKakao}
            autoCapitalize="none"
            keyboardType="url"
          />
          <PillInput
            label="입금 계좌"
            placeholder="예: 기업은행 123-456789-01 (예금주)"
            value={bankAccount}
            onChangeText={setBankAccount}
          />

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>운영 시간</SectionLabel>
          {DAYS.map((d) => {
            const dh = hours[d.key] ?? {};
            const color = dayColor(d.key);
            return (
              <View key={d.key} style={styles.dayRow}>
                <View
                  style={[
                    styles.dayBadge,
                    color ? { backgroundColor: `${color}22`, borderColor: color } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayBadgeText,
                      { color: color ?? COLORS.textSecondary },
                    ]}
                  >
                    {d.label}
                  </Text>
                </View>

                {dh.closed ? (
                  <TouchableOpacity
                    style={styles.closedChip}
                    onPress={() => updateDay(d.key, { closed: false })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.closedChipText}>휴무</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.timeChips}>
                    <TimeChip
                      value={dh.open}
                      onPress={() => setPicker({ key: d.key, which: "open" })}
                    />
                    <Text style={styles.tilde}>~</Text>
                    <TimeChip
                      value={dh.close}
                      onPress={() => setPicker({ key: d.key, which: "close" })}
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.dayToggle}
                  onPress={() =>
                    updateDay(d.key, { closed: !dh.closed })
                  }
                  hitSlop={8}
                >
                  <Text style={styles.dayToggleText}>
                    {dh.closed ? "운영" : "휴무"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>소개</SectionLabel>
          <PillInput
            placeholder="요가원 소개를 입력해주세요"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <ImageRow
            url={descriptionImage}
            uploading={uploading === "description"}
            onPick={() => pickSingle("description")}
            onRemove={() => setDescriptionImage(null)}
          />

          <View style={{ height: SPACING.lg }} />
          <Text style={styles.stepperLabel}>취소 마감 (수업 시작 전)</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setCancelCutoff((v) => Math.max(0, v - 1))}
              disabled={cancelCutoff <= 0}
            >
              <Ionicons
                name="remove"
                size={22}
                color={cancelCutoff <= 0 ? COLORS.textMuted : COLORS.text}
              />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperValueText}>
                {cancelCutoff === 0 ? "제한 없음" : `${cancelCutoff}시간 전`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setCancelCutoff((v) => Math.min(48, v + 1))}
              disabled={cancelCutoff >= 48}
            >
              <Ionicons
                name="add"
                size={22}
                color={cancelCutoff >= 48 ? COLORS.textMuted : COLORS.text}
              />
            </TouchableOpacity>
          </View>

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>등록/예약 안내</SectionLabel>
          <PillInput
            placeholder="등록/예약 안내를 입력해주세요"
            value={policy}
            onChangeText={setPolicy}
            multiline
          />
          <ImageRow
            url={policyImage}
            uploading={uploading === "policy"}
            onPick={() => pickSingle("policy")}
            onRemove={() => setPolicyImage(null)}
          />

          <View style={{ height: SPACING.lg }} />
          <SectionLabel>수업권 가격 안내</SectionLabel>
          <PillInput
            placeholder="수업권 가격 안내를 입력해주세요"
            value={pricing}
            onChangeText={setPricing}
            multiline
          />
          <ImageRow
            url={pricingImage}
            uploading={uploading === "pricing"}
            onPick={() => pickSingle("pricing")}
            onRemove={() => setPricingImage(null)}
          />

          <Button
            title={editing ? "변경 저장" : "요가원 추가"}
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            size="large"
            style={{ marginTop: SPACING.lg }}
          />
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Sheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker?.which === "close" ? "마감 시간" : "오픈 시간"}
      >
        {TIMES.map((t) => {
          const selected =
            picker != null && hours[picker.key]?.[picker.which] === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.timeOption, selected && styles.timeOptionOn]}
              onPress={() => {
                if (picker)
                  updateDay(
                    picker.key,
                    picker.which === "open"
                      ? { open: t, closed: false }
                      : { close: t, closed: false },
                  );
                setPicker(null);
              }}
            >
              <Text
                style={[
                  styles.timeOptionText,
                  selected && { color: COLORS.primary, fontWeight: "800" },
                ]}
              >
                {t}
              </Text>
              {selected ? (
                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </Sheet>
    </SafeAreaView>
  );
}

function TimeChip({
  value,
  onPress,
}: {
  value?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.timeChip} onPress={onPress} activeOpacity={0.85}>
      <Ionicons
        name="time-outline"
        size={14}
        color={value ? COLORS.primary : COLORS.textMuted}
      />
      <Text style={[styles.timeChipText, !value && { color: COLORS.textMuted }]}>
        {value ?? "시간"}
      </Text>
    </TouchableOpacity>
  );
}

function PhotoGallery({
  photos,
  uploading,
  onAdd,
  onRemove,
}: {
  photos: string[];
  uploading: boolean;
  onAdd: () => void;
  onRemove: (url: string) => void;
}) {
  return (
    <View>
      {photos.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galleryRow}
        >
          {photos.map((url) => (
            <View key={url} style={styles.thumbWrap}>
              <Image source={{ uri: url }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => onRemove(url)}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <Button
        title={
          photos.length > 0
            ? `사진 추가 (${photos.length}/${MAX_PHOTOS})`
            : "대표 사진 등록"
        }
        variant="outline"
        onPress={onAdd}
        loading={uploading}
        disabled={photos.length >= MAX_PHOTOS}
        style={{ marginTop: photos.length > 0 ? SPACING.sm : 0 }}
      />
    </View>
  );
}

function ImageRow({
  url,
  uploading,
  onPick,
  onRemove,
}: {
  url: string | null;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  if (url) {
    return (
      <View style={styles.imageWrap}>
        <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
        <View style={styles.imageActions}>
          <Button
            title="변경"
            variant="outline"
            size="small"
            onPress={onPick}
            loading={uploading}
            style={{ flex: 1 }}
          />
          <Button
            title="삭제"
            variant="destructive"
            size="small"
            onPress={onRemove}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    );
  }
  return (
    <Button
      title="이미지로 등록"
      variant="outline"
      onPress={onPick}
      loading={uploading}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: { fontSize: 14, fontWeight: "700" },
  timeChips: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  tilde: { color: COLORS.textMuted, fontSize: 14 },
  timeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeChipText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  closedChip: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closedChipText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "700" },
  dayToggle: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dayToggleText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "700" },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  timeOptionOn: { backgroundColor: "rgba(139, 92, 246, 0.08)" },
  timeOptionText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  stepperLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueText: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  galleryRow: { gap: SPACING.sm, paddingVertical: 2 },
  thumbWrap: { position: "relative" },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: { marginTop: 2, marginBottom: SPACING.sm },
  image: {
    width: "100%",
    height: 200,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  imageActions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
});
