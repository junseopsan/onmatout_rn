import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StudentStudioSwitcher } from "../../components/student/StudentStudioSwitcher";
import { StudioInfoCard } from "../../components/student/StudioInfoCard";
import { WeekPicker } from "../../components/student/WeekPicker";
import { EmptyState } from "../../components/ui/EmptyState";
import { ListSkeleton } from "../../components/ui/ListSkeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useStudentStudios } from "../../hooks/useStudentStudios";
import { haptics } from "../../lib/haptics";
import {
  studentBookingApi,
  type MyMembershipInfo,
  type StudioClass,
  type StudioFullInfo,
} from "../../lib/api/studentBooking";
import { yogaTalkApi } from "../../lib/api/yogaTalk";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type DaySlot = {
  classId: string;
  classTitle: string;
  classLocation: string | null;
  teacherName: string;
  capacity: number | null;
  scheduleId: string;
  startTime: string;
  endTime: string;
  date: string;
};

type DayStats = {
  booked_count: number;
  waitlist_count: number;
  my_status: string | null;
};

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];
const DOW_LABELS_FULL = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatHHMM(s: string) {
  return s.slice(0, 5);
}

function fmtDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW_KO[d.getDay()]})`;
}

export default function StudentClassesTabScreen() {
  const navigation = useNavigation<Nav>();
  const { activeMembership, activeStudio, memberships, loaded: studiosLoaded } =
    useStudentStudios();

  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [teacherNames, setTeacherNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [statsByKey, setStatsByKey] = useState<Map<string, DayStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [studioInfo, setStudioInfo] = useState<StudioFullInfo | null>(null);
  const [activeMemberships, setActiveMemberships] = useState<
    MyMembershipInfo[]
  >([]);

  const studio = activeStudio;
  const studentProfileId = activeMembership?.studentProfileId ?? null;

  // 요가원 상세 + 활성 수업권 로드
  useEffect(() => {
    if (!activeMembership) {
      setStudioInfo(null);
      setActiveMemberships([]);
      return;
    }
    let mounted = true;
    Promise.all([
      studentBookingApi.getStudioFullInfo(activeMembership.studio.id),
      studentBookingApi.listActiveMemberships(
        activeMembership.studentProfileId,
      ),
    ])
      .then(([info, memos]) => {
        if (!mounted) return;
        setStudioInfo(info);
        setActiveMemberships(memos);
      })
      .catch((e) => console.warn("[ClassesTab] studio info load failed", e));
    return () => {
      mounted = false;
    };
  }, [activeMembership]);

  const loadClasses = useCallback(async () => {
    if (!activeMembership) {
      setClasses([]);
      setTeacherNames(new Map());
      return;
    }
    const { classes: cs, teacherNames: tn } =
      await studentBookingApi.listMyEnrolledClassesWithMeta(
        activeMembership.studentProfileId,
      );
    if (__DEV__) {
      console.log(
        "[ClassesTab] loaded",
        cs.length,
        "classes",
        cs.map((c) => ({
          id: c.id,
          title: c.title,
          schedules: (c.class_schedules ?? []).map((s) => s.day_of_week),
        })),
      );
    }
    setClasses(cs);
    setTeacherNames(tn);
  }, [activeMembership]);

  useFocusEffect(
    useCallback(() => {
      if (!studiosLoaded) return;
      setLoading(true);
      loadClasses()
        .catch((e) => console.warn("[ClassesTab] failed", e))
        .finally(() => setLoading(false));
    }, [loadClasses, studiosLoaded]),
  );

  // studiosLoaded가 늦게 true가 되면 useFocusEffect는 다시 트리거 안 되므로 보강
  useEffect(() => {
    if (!studiosLoaded) return;
    if (!activeMembership) return;
    setLoading(true);
    loadClasses()
      .catch((e) => console.warn("[ClassesTab] load failed", e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studiosLoaded, activeMembership?.studentProfileId]);

  // 한 주의 모든 슬롯을 요일별로 그룹핑 — SectionList용
  const weekSections = useMemo(() => {
    if (classes.length === 0) return [];
    const sections: { title: string; date: string; dow: number; data: DaySlot[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const iso = `${yyyy}-${mm}-${dd}`;
      const dow = d.getDay();
      const daySlots: DaySlot[] = [];
      for (const c of classes) {
        for (const s of c.class_schedules ?? []) {
          if (s.day_of_week === dow) {
            daySlots.push({
              classId: c.id,
              classTitle: c.title,
              classLocation: c.location,
              teacherName: teacherNames.get(c.teacher_id) ?? "지도자",
              capacity: c.capacity ?? null,
              scheduleId: s.id,
              startTime: s.start_time,
              endTime: s.end_time,
              date: iso,
            });
          }
        }
      }
      if (daySlots.length === 0) continue;
      daySlots.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
      sections.push({
        title: `${DOW_LABELS_FULL[dow]} ${d.getMonth() + 1}/${d.getDate()}`,
        date: iso,
        dow,
        data: daySlots,
      });
    }
    return sections;
  }, [classes, weekStart, teacherNames]);

  const allSlots = useMemo(
    () => weekSections.flatMap((s) => s.data),
    [weekSections],
  );

  // 선택된 날짜의 슬롯별 stats 불러오기 — 의존성 비워서 무한루프 방지
  // (이미 캐시된 키는 setState 콜백 안에서 skip)
  const loadStatsForSlots = useCallback(async (slots: DaySlot[]) => {
    const fetched: Array<[string, DayStats]> = [];
    for (const slot of slots) {
      try {
        const s = await studentBookingApi.getClassDayStats(
          slot.classId,
          slot.date,
        );
        fetched.push([`${slot.classId}|${slot.date}`, s]);
      } catch {
        // skip
      }
    }
    setStatsByKey((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const [k, v] of fetched) {
        if (!next.has(k)) {
          next.set(k, v);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // 주가 바뀌거나 classes 가 바뀌면 모든 슬롯의 stats 로드
  React.useEffect(() => {
    if (allSlots.length === 0) return;
    loadStatsForSlots(allSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, classes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setStatsByKey(new Map());
    await loadClasses();
    setRefreshing(false);
  }, [loadClasses]);


  const handleBookOrWaitlist = async (slot: DaySlot) => {
    if (!studentProfileId) return;
    const key = `${slot.classId}|${slot.date}`;
    const stats = statsByKey.get(key);
    const isCanceling =
      stats?.my_status === "booked" || stats?.my_status === "waitlisted";

    // 취소 확인 다이얼로그
    if (isCanceling) {
      const dateLabel = fmtDateLabel(slot.date);
      const timeLabel = `${formatHHMM(slot.startTime)} – ${formatHHMM(slot.endTime)}`;
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "수업 취소",
          `${dateLabel}, ${timeLabel}\n${slot.classTitle}\n\n이 수업을 취소하시겠어요?`,
          [
            {
              text: "닫기",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "취소하기",
              style: "destructive",
              onPress: () => resolve(true),
            },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        );
      });
      if (!confirmed) return;
    }

    setBusy(key);
    haptics.medium();
    try {
      if (isCanceling) {
        const bookings = await studentBookingApi.listMyBookings(
          studentProfileId,
          slot.date,
        );
        const mine = bookings.find(
          (b) => b.class_id === slot.classId && b.booking_date === slot.date,
        );
        if (mine) {
          await studentBookingApi.cancel(mine.id);
        }
      } else {
        await studentBookingApi.bookOrWaitlist({
          classId: slot.classId,
          studentProfileId,
          bookingDate: slot.date,
        });
      }
      haptics.success();
      // stats 다시 불러옴 (이 슬롯만)
      const fresh = await studentBookingApi.getClassDayStats(
        slot.classId,
        slot.date,
      );
      setStatsByKey((m) => {
        const n = new Map(m);
        n.set(key, fresh);
        return n;
      });
    } catch (e: any) {
      haptics.error();
      Alert.alert("처리 실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  };

  const openYogaTalkForClass = async (
    classId: string,
    classTitle: string,
    teacherUserId: string,
  ) => {
    if (!activeMembership) return;
    try {
      const thread = await yogaTalkApi.getOrCreateThread({
        teacherUserId,
        studentProfileId: activeMembership.studentProfileId,
        classId,
        title: `수업, ${classTitle}`,
        category: "class_feedback",
      });
      navigation.navigate("YogaTalkThread", { threadId: thread.id });
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  if (loading && !studio) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <PageHeader />
        <ListSkeleton count={4} rowHeight={92} />
      </SafeAreaView>
    );
  }

  const hasMemberships = memberships.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader
        eyebrowSlot={hasMemberships ? <StudentStudioSwitcher /> : undefined}
      />

      {!studio ? (
        <EmptyState
          icon="🏠"
          title="등록된 요가원이 없어요"
          description={
            "지도자가 보낸 초대 코드로 가입하면\n해당 요가원의 수업을 신청할 수 있어요."
          }
        />
      ) : (
        <>
          {studioInfo ? (
            <StudioInfoCard
              studio={studioInfo}
              memberships={activeMemberships}
            />
          ) : null}
          <WeekPicker
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            maxWeekOffset={1}
          />

          <SectionList
            sections={weekSections}
            keyExtractor={(slot, idx) => `${slot.classId}|${slot.date}-${idx}`}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="🗓️"
                title={
                  classes.length === 0
                    ? "등록된 수업이 없어요"
                    : "이번 주에 수업이 없어요"
                }
                description={
                  classes.length === 0
                    ? "지도자가 수업에 등록해주면\n이곳에서 스케줄을 확인하고 신청할 수 있어요."
                    : "다음 주를 확인해 보세요."
                }
              />
            }
            ListFooterComponent={<View style={{ height: SPACING.xxl }} />}
            renderSectionHeader={({ section }) => {
              const isPast = section.date < todayISO();
              const isToday = section.date === todayISO();
              const d = new Date(section.date + "T00:00:00");
              const relLabel = isToday
                ? "오늘"
                : section.date ===
                    (() => {
                      const t = new Date();
                      t.setDate(t.getDate() + 1);
                      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                    })()
                  ? "내일"
                  : null;
              return (
                <View style={styles.daySectionHeader}>
                  {isToday ? (
                    <View style={styles.todayDot} />
                  ) : (
                    <View style={styles.dayDot} />
                  )}
                  <Text
                    style={[
                      styles.daySectionTitle,
                      isToday && styles.daySectionTitleToday,
                      isPast && styles.daySectionPast,
                    ]}
                  >
                    {relLabel ? `${relLabel}, ` : ""}
                    {d.getMonth() + 1}월 {d.getDate()}일 ({DOW_KO[d.getDay()]})
                  </Text>
                </View>
              );
            }}
            renderItem={({ item: slot }) => {
              const key = `${slot.classId}|${slot.date}`;
              const stats = statsByKey.get(key);
              const isBooked = stats?.my_status === "booked";
              const isWaitlisted = stats?.my_status === "waitlisted";
              const booked = stats?.booked_count ?? 0;
              const cap = slot.capacity;
              const isFull = cap !== null && booked >= cap;
              const isBusy = busy === key;
              const isPast = slot.date < todayISO();

              let btnLabel = "신청";
              let btnStyle: any = styles.bookBtn;
              let btnTextStyle: any = styles.bookBtnText;
              if (isPast && !isBooked && !isWaitlisted) {
                btnLabel = "마감";
                btnStyle = styles.bookBtnPast;
                btnTextStyle = styles.bookBtnPastText;
              } else if (isBooked) {
                btnLabel = isPast ? "신청됨" : "수업 취소";
                btnStyle = styles.bookBtnBooked;
                btnTextStyle = styles.bookBtnBookedText;
              } else if (isWaitlisted) {
                btnLabel = "대기중";
                btnStyle = styles.bookBtnWaitlist;
                btnTextStyle = styles.bookBtnWaitlistText;
              } else if (isFull) {
                btnLabel = "대기 신청";
                btnStyle = styles.bookBtnWaitlist;
                btnTextStyle = styles.bookBtnWaitlistText;
              }

              return (
                <SurfaceCard
                  style={
                    isPast ? { ...styles.slot, ...styles.slotPast } : styles.slot
                  }
                >
                  <View style={styles.slotMain}>
                    <Text style={styles.slotTime}>
                      {formatHHMM(slot.startTime)} – {formatHHMM(slot.endTime)}
                    </Text>
                    <Text style={styles.slotTitle} numberOfLines={1}>
                      {slot.classTitle}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="person-outline"
                          size={12}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.metaText}>{slot.teacherName}</Text>
                      </View>
                      <View
                        style={[
                          styles.capacityChip,
                          isFull && !isBooked && styles.capacityChipFull,
                        ]}
                      >
                        <Ionicons
                          name="people"
                          size={13}
                          color={
                            isFull && !isBooked ? "#F87171" : COLORS.primary
                          }
                        />
                        <Text
                          style={[
                            styles.capacityText,
                            isFull && !isBooked && { color: "#F87171" },
                          ]}
                        >
                          {booked}
                          {cap !== null ? `/${cap}` : ""}
                        </Text>
                        {stats && stats.waitlist_count > 0 ? (
                          <Text style={styles.capacityWait}>
                           , 대기 {stats.waitlist_count}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.slotActions}>
                    <TouchableOpacity
                      style={[btnStyle, isBusy && { opacity: 0.6 }]}
                      disabled={isBusy || (isPast && !isBooked && !isWaitlisted)}
                      onPress={() => handleBookOrWaitlist(slot)}
                      activeOpacity={0.85}
                    >
                      <Text style={btnTextStyle}>
                        {isBusy ? "…" : btnLabel}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        const c = classes.find((x) => x.id === slot.classId);
                        if (!c) return;
                        openYogaTalkForClass(
                          slot.classId,
                          slot.classTitle,
                          c.teacher_id,
                        );
                      }}
                      style={styles.talkBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={14}
                        color={COLORS.primary}
                      />
                      <Text style={styles.talkBtnText}>요가톡</Text>
                    </TouchableOpacity>
                  </View>
                </SurfaceCard>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
    paddingRight: SPACING.md,
  },
  slotMain: { flex: 1 },
  slotTime: {
    ...TEXT.caption,
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  slotTitle: { ...TEXT.bodyMed, color: COLORS.text, marginTop: 2 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6, alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { ...TEXT.micro, color: COLORS.textSecondary, fontSize: 11 },
  capacityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
  },
  capacityChipFull: {
    backgroundColor: "rgba(248, 113, 113, 0.14)",
  },
  capacityText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  capacityWait: {
    color: COLORS.warning,
    fontSize: 11,
    fontWeight: "700",
  },
  slotActions: { alignItems: "stretch", gap: 6 },
  bookBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    minWidth: 76,
    alignItems: "center",
  },
  bookBtnText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  bookBtnBooked: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(248, 113, 113, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.5)",
    minWidth: 76,
    alignItems: "center",
  },
  bookBtnBookedText: { color: "#F87171", fontSize: 12, fontWeight: "700" },
  bookBtnWaitlist: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.5)",
    minWidth: 76,
    alignItems: "center",
  },
  bookBtnWaitlistText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: "700",
  },
  talkBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    minWidth: 76,
  },
  talkBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  daySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: SPACING.md,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  daySectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  daySectionTitleToday: {
    color: COLORS.primary,
  },
  daySectionPast: {
    color: COLORS.textMuted,
  },
  slotPast: {
    opacity: 0.55,
  },
  bookBtnPast: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 76,
    alignItems: "center",
  },
  bookBtnPastText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
});
