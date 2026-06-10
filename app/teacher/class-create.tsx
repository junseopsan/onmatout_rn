import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { SPACING } from "../../constants/Design";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { teacherApi } from "../../lib/api/teacher";
import { RootStackParamList } from "../../navigation/types";
import { DAY_OF_WEEK_LABELS_KO } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ScheduleEntry = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const DEFAULT_START = "09:00";
const DEFAULT_END = "10:30";

const DAY_COLORS: Record<number, string> = {
  0: "#EF4444", // Sun
  1: "#3B82F6",
  2: "#3B82F6",
  3: "#3B82F6",
  4: "#3B82F6",
  5: "#3B82F6",
  6: "#10B981", // Sat
};

export default function TeacherClassCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { activeStudio } = usePivotStudios();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!user?.id || !canSubmit) return;
    setSubmitting(true);
    try {
      const cap = capacity.trim() ? parseInt(capacity.trim(), 10) : null;
      const cls = await teacherApi.createClass(
        {
          teacher_id: user.id,
          studio_id: activeStudio?.id ?? null,
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          capacity: cap && cap > 0 ? cap : null,
          is_active: true,
        } as any,
        schedules.map((s) => ({
          day_of_week: s.day_of_week,
          start_time: ensureSeconds(s.start_time),
          end_time: ensureSeconds(s.end_time),
        })),
      );
      navigation.replace("TeacherClassDetail", { classId: cls.id });
    } catch (e: any) {
      Alert.alert("등록 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        title="클래스 만들기"
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
          <PillInput
            label="정원"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="예: 10"
            keyboardType="numeric"
          />

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

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.submitWrap}>
        <Button
          title="클래스 생성"
          size="large"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
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
                        <Text style={[styles.tpItemText, on && styles.tpItemTextOn]}>
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
                        <Text style={[styles.tpItemText, on && styles.tpItemTextOn]}>
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
  hint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.md,
    paddingHorizontal: 4,
  },
  submitWrap: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    bottom: SPACING.lg,
  },
});
