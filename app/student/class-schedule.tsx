import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import {
  studentBookingApi,
  type ClassBooking,
  type StudioClass,
} from "../../lib/api/studentBooking";
import { RootStackParamList } from "../../navigation/types";
import { DAY_OF_WEEK_LABELS_KO } from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type DaySlot = {
  classId: string;
  classTitle: string;
  classLocation: string | null;
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  date: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatHHMM(s: string) {
  return s.slice(0, 5);
}

export default function StudentClassScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [studio, setStudio] = useState<{
    id: string;
    name: string;
    location: string | null;
  } | null>(null);
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const memberships = await studentBookingApi.listMyMemberships(user.id);
    const me = memberships[0] ?? null;
    if (!me) {
      setStudio(null);
      setStudentProfileId(null);
      setClasses([]);
      setBookings([]);
      return;
    }
    setStudio(me.studio);
    setStudentProfileId(me.studentProfileId);
    const [cs, bs] = await Promise.all([
      studentBookingApi.listStudioClasses(me.studio.id),
      studentBookingApi.listMyBookings(me.studentProfileId, todayISO()),
    ]);
    setClasses(cs);
    setBookings(bs);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((e) => console.warn("[ClassSchedule] failed", e))
        .finally(() => setLoading(false));
    }, [load]),
  );

  // Generate the next 14 days of class slots
  const upcomingSlots: DaySlot[] = useMemo(() => {
    if (classes.length === 0) return [];
    const slots: DaySlot[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = addDays(start, i);
      const dow = d.getDay();
      for (const c of classes) {
        for (const s of c.class_schedules ?? []) {
          if (s.day_of_week === dow) {
            slots.push({
              classId: c.id,
              classTitle: c.title,
              classLocation: c.location,
              scheduleId: s.id,
              dayOfWeek: dow,
              startTime: s.start_time,
              endTime: s.end_time,
              date: toISO(d),
            });
          }
        }
      }
    }
    return slots.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.startTime < b.startTime ? -1 : 1;
    });
  }, [classes]);

  const bookingByKey = useMemo(() => {
    const m = new Map<string, ClassBooking>();
    for (const b of bookings) {
      m.set(`${b.class_id}|${b.booking_date}`, b);
    }
    return m;
  }, [bookings]);

  const handleBook = async (slot: DaySlot) => {
    if (!studentProfileId) return;
    const key = `${slot.classId}|${slot.date}`;
    setBusy(key);
    try {
      const existing = bookingByKey.get(key);
      if (existing && existing.status === "booked") {
        await studentBookingApi.cancel(existing.id);
      } else if (existing) {
        // canceled previously — re-book by inserting a new one
        await studentBookingApi.book({
          classId: slot.classId,
          studentProfileId,
          bookingDate: slot.date,
        });
      } else {
        await studentBookingApi.book({
          classId: slot.classId,
          studentProfileId,
          bookingDate: slot.date,
        });
      }
      await load();
    } catch (e: any) {
      Alert.alert(
        "처리 실패",
        e?.message ?? "잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setBusy(null);
    }
  };

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, DaySlot[]>();
    for (const s of upcomingSlots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return Array.from(map.entries());
  }, [upcomingSlots]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader onBack={() => navigation.goBack()} title="수업 신청" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!studio) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader onBack={() => navigation.goBack()} title="수업 신청" />
        <EmptyState
          icon="🏠"
          title="등록된 요가원이 없어요"
          description={
            "선생님의 초대 코드로 가입하면\n해당 요가원의 수업을 신청할 수 있어요."
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={studio.name}
        eyebrow="수업 신청"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {grouped.length === 0 ? (
          <EmptyState
            icon="🗓️"
            title="예정된 수업이 없어요"
            description="요가원에 등록된 클래스 스케줄이 비어있습니다."
          />
        ) : (
          grouped.map(([date, slots]) => {
            const d = new Date(date + "T00:00:00");
            const dow = d.getDay();
            const isToday = date === todayISO();
            return (
              <View key={date} style={styles.dayBlock}>
                <SectionLabel>
                  {`${date.slice(5).replace("-", "/")} (${DAY_OF_WEEK_LABELS_KO[dow]})${isToday ? ", 오늘" : ""}`}
                </SectionLabel>
                {slots.map((slot) => {
                  const key = `${slot.classId}|${slot.date}`;
                  const booking = bookingByKey.get(key);
                  const isBooked = booking?.status === "booked";
                  const isBusy = busy === key;
                  return (
                    <SurfaceCard key={key} style={styles.slotCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.slotTime}>
                          {formatHHMM(slot.startTime)} – {formatHHMM(slot.endTime)}
                        </Text>
                        <Text style={styles.slotTitle} numberOfLines={1}>
                          {slot.classTitle}
                        </Text>
                        {slot.classLocation ? (
                          <View style={styles.locRow}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color={COLORS.textMuted}
                            />
                            <Text style={styles.slotLoc} numberOfLines={1}>
                              {slot.classLocation}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.bookBtn,
                          isBooked && styles.bookBtnActive,
                          isBusy && { opacity: 0.6 },
                        ]}
                        disabled={isBusy}
                        onPress={() => handleBook(slot)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.bookBtnText,
                            isBooked && styles.bookBtnTextActive,
                          ]}
                        >
                          {isBusy ? "…" : isBooked ? "신청됨" : "신청"}
                        </Text>
                      </TouchableOpacity>
                    </SurfaceCard>
                  );
                })}
              </View>
            );
          })
        )}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  dayBlock: { marginBottom: SPACING.lg },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  slotTime: { ...TEXT.caption, color: COLORS.primary, fontWeight: "700", fontSize: 12, letterSpacing: 0.4 },
  slotTitle: { ...TEXT.bodyMed, color: COLORS.text, marginTop: 2 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  slotLoc: { ...TEXT.micro, color: COLORS.textMuted, fontSize: 12 },
  bookBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
  },
  bookBtnActive: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bookBtnText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
  bookBtnTextActive: { color: COLORS.primary },
});
