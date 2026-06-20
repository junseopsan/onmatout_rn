import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { PillInput } from "../../components/ui/PillInput";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import { DAY_OF_WEEK_LABELS_KO } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherClassEdit">;

type ScheduleEntry = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const DEFAULT_START = "19:00";
const DEFAULT_END = "19:50";

const DAY_COLORS: Record<number, string> = {
  0: "#EF4444", // 일
  1: "#3B82F6", // 월 (월수금 = 파랑)
  2: "#F59E0B", // 화 (화목 = 주황)
  3: "#3B82F6", // 수
  4: "#F59E0B", // 목
  5: "#3B82F6", // 금
  6: "#10B981", // 토
};

const MIN_CAPACITY = 1;
const MAX_CAPACITY = 50;

export default function TeacherClassEditScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { classId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);

  const adjustCapacity = (delta: number) =>
    setCapacity((c) =>
      Math.min(MAX_CAPACITY, Math.max(MIN_CAPACITY, c + delta)),
    );

  useEffect(() => {
    let mounted = true;
    teacherApi
      .getClass(classId)
      .then((c) => {
        if (!mounted) return;
        setTitle(c.title);
        setDescription(c.description ?? "");
        setLocation(c.location ?? "");
        setCapacity(c.capacity && c.capacity > 0 ? c.capacity : 10);
        setIsActive(c.is_active);
        setSchedules(
          (c.class_schedules ?? [])
            .map((s) => ({
              day_of_week: s.day_of_week,
              start_time: (s.start_time ?? DEFAULT_START).slice(0, 5),
              end_time: (s.end_time ?? DEFAULT_END).slice(0, 5),
            }))
            .sort((a, b) => a.day_of_week - b.day_of_week),
        );
      })
      .catch((e) => console.warn("[ClassEdit] load failed", e))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [classId]);

  const toggleDay = (day: number) => {
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.day_of_week === day);
      if (idx >= 0) return prev.filter((s) => s.day_of_week !== day);
      return [
        ...prev,
        { day_of_week: day, start_time: DEFAULT_START, end_time: DEFAULT_END },
      ].sort((a, b) => a.day_of_week - b.day_of_week);
    });
  };

  const updateScheduleTime = (
    day: number,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s)),
    );
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert("입력 확인", "클래스 이름을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.updateClass(classId, {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        capacity,
        is_active: isActive,
      });
      await teacherApi.replaceClassSchedules(
        classId,
        schedules.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: ensureSeconds(s.start_time),
          end_time: ensureSeconds(s.end_time),
        })),
      );
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader
          title="클래스 수정"
          serif={false}
          onBack={() => navigation.goBack()}
        />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        title="클래스 수정"
        serif={false}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.form}>
          <PillInput
            label="클래스 이름"
            required
            value={title}
            onChangeText={setTitle}
            placeholder="예: 월수금 오전 하타요가"
          />
          <PillInput
            label="설명"
            value={description}
            onChangeText={setDescription}
            placeholder="예: 느린 호흡과 정렬 위주 90분"
            multiline
          />
          <PillInput
            label="위치"
            value={location}
            onChangeText={setLocation}
            placeholder="예: 온매트 요가원 A룸"
          />

          <Text style={styles.label}>정원</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                capacity <= MIN_CAPACITY && styles.stepperBtnDisabled,
              ]}
              onPress={() => adjustCapacity(-1)}
              disabled={capacity <= MIN_CAPACITY}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={22} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperValueText}>{capacity}</Text>
              <Text style={styles.stepperUnit}>명</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                capacity >= MAX_CAPACITY && styles.stepperBtnDisabled,
              ]}
              onPress={() => adjustCapacity(1)}
              disabled={capacity >= MAX_CAPACITY}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>요일 / 시간</Text>
          <View style={styles.dayRow}>
            {Object.entries(DAY_OF_WEEK_LABELS_KO).map(([dayStr, label]) => {
              const day = Number(dayStr);
              const picked = schedules.some((s) => s.day_of_week === day);
              return (
                <Chip
                  key={day}
                  label={label}
                  color={DAY_COLORS[day]}
                  active={picked}
                  size="sm"
                  onPress={() => toggleDay(day)}
                />
              );
            })}
          </View>

          {schedules.length > 0 ? (
            <View style={styles.scheduleList}>
              {schedules.map((s) => (
                <View key={s.day_of_week} style={styles.scheduleCard}>
                  <View
                    style={[
                      styles.scheduleAccent,
                      { backgroundColor: DAY_COLORS[s.day_of_week] },
                    ]}
                  />
                  <View style={styles.scheduleBody}>
                    <View style={styles.scheduleHead}>
                      <Text style={styles.scheduleDayName}>
                        {DAY_OF_WEEK_LABELS_KO[s.day_of_week]}요일
                      </Text>
                      <TouchableOpacity
                        onPress={() => toggleDay(s.day_of_week)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.scheduleRemove}
                      >
                        <Ionicons
                          name="close"
                          size={14}
                          color={COLORS.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.scheduleTimes}>
                      <View style={styles.scheduleTimeWrap}>
                        <Text style={styles.scheduleTimeLabel}>시작</Text>
                        <TimeField
                          value={s.start_time}
                          onChange={(v) =>
                            updateScheduleTime(s.day_of_week, "start_time", v)
                          }
                        />
                      </View>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={COLORS.textMuted}
                      />
                      <View style={styles.scheduleTimeWrap}>
                        <Text style={styles.scheduleTimeLabel}>종료</Text>
                        <TimeField
                          value={s.end_time}
                          onChange={(v) =>
                            updateScheduleTime(s.day_of_week, "end_time", v)
                          }
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.switchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>활성</Text>
              <Text style={styles.switchHint}>
                비활성 클래스는 새 수련생 배정, 출석 체크에서 제외돼요.
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: COLORS.primary, false: COLORS.border }}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.submitWrap}>
        <Button
          title={submitting ? "저장 중..." : "저장"}
          size="large"
          onPress={submit}
          loading={submitting}
          disabled={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const display = value && value.length >= 5 ? value.slice(0, 5) : "00:00";
  const hour = parseInt(display.slice(0, 2), 10) || 0;
  const minute = parseInt(display.slice(3, 5), 10) || 0;

  const hours = Array.from({ length: 19 }, (_, i) => i + 5); // 5–23시
  const minutes = [0, 15, 30, 45];

  const pad = (n: number) => n.toString().padStart(2, "0");

  const setHour = (h: number) => onChange(`${pad(h)}:${pad(minute)}`);
  const setMinute = (m: number) => onChange(`${pad(hour)}:${pad(m)}`);

  return (
    <>
      <TouchableOpacity
        style={styles.timeBox}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.timeInput}>{display}</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.tpBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.tpSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.tpHeader}>
              <Text style={styles.tpHeaderText}>시간 선택</Text>
              <Text style={styles.tpHeaderValue}>{display}</Text>
            </View>
            <View style={styles.tpRow}>
              <View style={styles.tpCol}>
                <Text style={styles.tpColLabel}>시</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {hours.map((h) => {
                    const on = h === hour;
                    return (
                      <TouchableOpacity
                        key={h}
                        onPress={() => setHour(h)}
                        style={[styles.tpItem, on && styles.tpItemOn]}
                      >
                        <Text
                          style={[styles.tpItemText, on && styles.tpItemTextOn]}
                        >
                          {pad(h)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={styles.tpCol}>
                <Text style={styles.tpColLabel}>분</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => {
                    const on = m === minute;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setMinute(m)}
                        style={[styles.tpItem, on && styles.tpItemOn]}
                      >
                        <Text
                          style={[styles.tpItemText, on && styles.tpItemTextOn]}
                        >
                          {pad(m)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity
              style={styles.tpDone}
              onPress={() => setOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.tpDoneText}>완료</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function ensureSeconds(t: string): string {
  if (t.length === 5) return `${t}:00`;
  return t;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  form: { padding: SPACING.xl, paddingTop: SPACING.lg },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
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
  stepperBtnDisabled: { opacity: 0.4 },
  stepperValue: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
    minWidth: 72,
  },
  stepperValueText: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  stepperUnit: { color: COLORS.textSecondary, fontSize: 14 },
  dayRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
  },
  scheduleList: { marginTop: SPACING.lg, gap: 10 },
  scheduleCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  scheduleAccent: { width: 4 },
  scheduleBody: { flex: 1, padding: 12, gap: 10 },
  scheduleHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleDayName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  scheduleRemove: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: COLORS.surfaceDark,
  },
  scheduleTimes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scheduleTimeWrap: { flex: 1, gap: 4 },
  scheduleTimeLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  timeBox: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  timeInput: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
    letterSpacing: 0.5,
  },
  tpBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  tpSheet: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  tpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  tpHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  tpHeaderValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tpRow: {
    flexDirection: "row",
    height: 220,
  },
  tpCol: {
    flex: 1,
    paddingVertical: 8,
  },
  tpColLabel: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingBottom: 4,
  },
  tpItem: {
    paddingVertical: 8,
    alignItems: "center",
  },
  tpItemOn: {
    backgroundColor: "rgba(139, 92, 246, 0.16)",
  },
  tpItemText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  tpItemTextOn: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  tpDone: {
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  tpDoneText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  switchTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  switchHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
