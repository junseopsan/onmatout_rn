import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { IconBadge } from "../../components/ui/IconBadge";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { StatusChip } from "../../components/ui/StatusChip";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import QRCode from "react-native-qrcode-svg";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { usePivotStudios } from "../../hooks/usePivotStudios";
import { pivotStudioApi } from "../../lib/api/pivotStudio";
import { teacherApi } from "../../lib/api/teacher";
import { yogaTalkApi } from "../../lib/api/yogaTalk";
import { RootStackParamList } from "../../navigation/types";
import type {
  Attendance,
  Class,
  Membership,
  StudentProfile,
} from "../../types/teacher";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "TeacherMemberDetail">;

// 출석/결석 두 가지로만 표시
const STATUS_LABEL: Record<Attendance["status"], string> = {
  present: "출석",
  late: "출석",
  makeup: "출석",
  absent: "결석",
  canceled: "결석",
};
const STATUS_COLOR: Record<Attendance["status"], string> = {
  present: COLORS.success,
  late: COLORS.success,
  makeup: COLORS.success,
  absent: COLORS.error,
  canceled: COLORS.error,
};

export default function TeacherMemberDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { activeStudio, isDirectorOfActive } = usePivotStudios();
  const { studentProfileId } = route.params;

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [membershipClass, setMembershipClass] = useState<Class | null>(null);
  const [studioName, setStudioName] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTeacherOfStudio, setIsTeacherOfStudio] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const load = useCallback(async () => {
    const [s, m, a, tp] = await Promise.all([
      teacherApi.getStudent(studentProfileId),
      teacherApi.getStudentMembership(studentProfileId),
      teacherApi.listStudentAttendance(studentProfileId, 20),
      user?.id ? teacherApi.getMyTeacherProfile(user.id) : Promise.resolve(null),
    ]);
    setStudent(s);
    setMembership(m);
    setAttendance(a);
    setStudioName(tp?.studio_name ?? null);

    if (m?.class_id) {
      try {
        const cls = await teacherApi.getClass(m.class_id);
        setMembershipClass(cls);
      } catch {
        setMembershipClass(null);
      }
    } else {
      setMembershipClass(null);
    }

    // 선생님 등록 여부 확인 (active studio 기준)
    if (s.user_id && activeStudio?.id) {
      try {
        const list = await pivotStudioApi.listStudioTeachers(activeStudio.id);
        setIsTeacherOfStudio(
          list.some(
            (r) => r.teacher_id === s.user_id && r.status === "active",
          ),
        );
      } catch {
        setIsTeacherOfStudio(false);
      }
    } else {
      setIsTeacherOfStudio(false);
    }
  }, [studentProfileId, user?.id, activeStudio?.id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await load();
      } catch (e) {
        console.warn("[MemberDetail] load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    const unsub = navigation.addListener("focus", () => {
      run();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const promoteToTeacher = async () => {
    if (!student?.user_id || !activeStudio?.id) {
      Alert.alert(
        "승급 불가",
        "수련생이 아직 앱에 가입하지 않았거나 활성 요가원이 없습니다.",
      );
      return;
    }
    Alert.alert(
      "선생님으로 승급",
      `${student.name} 님을 ${activeStudio.name} 요가원의 선생님으로 등록할까요? 클래스는 만들 수 없지만 수련생 관리, 출석을 도와줄 수 있어요.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "승급",
          style: "default",
          onPress: async () => {
            setPromoting(true);
            try {
              await pivotStudioApi.promoteStudentToTeacher({
                studioId: activeStudio.id,
                teacherUserId: student.user_id!,
              });
              setIsTeacherOfStudio(true);
              Alert.alert("완료", "선생님으로 승급됐어요.");
            } catch (e: any) {
              Alert.alert(
                "실패",
                e?.message ?? "잠시 후 다시 시도해 주세요.",
              );
            } finally {
              setPromoting(false);
            }
          },
        },
      ],
    );
  };

  const openYogaTalk = async () => {
    if (!user?.id || !student) return;
    try {
      const thread = await yogaTalkApi.getOrCreateThread({
        teacherUserId: user.id,
        studentProfileId: student.id,
        classId: null,
        title: `${student.name} 님과의 대화`,
        category: "general",
      });
      navigation.navigate("YogaTalkThread", { threadId: thread.id });
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
    }
  };

  const demoteFromTeacher = async () => {
    if (!student?.user_id || !activeStudio?.id) return;

    const doRemove = async (reason?: string | null) => {
      setPromoting(true);
      try {
        await pivotStudioApi.removeStudioTeacher({
          studioId: activeStudio.id,
          teacherUserId: student.user_id!,
          reason: reason ?? null,
        });
        setIsTeacherOfStudio(false);
      } catch (e: any) {
        Alert.alert("실패", e?.message ?? "잠시 후 다시 시도해 주세요.");
      } finally {
        setPromoting(false);
      }
    };

    if (Platform.OS === "ios" && (Alert as any).prompt) {
      (Alert as any).prompt(
        "선생님 해제",
        `${student.name} 님을 선생님에서 해제할까요? 사유를 남기면 기록됩니다 (선택).`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "해제",
            style: "destructive",
            onPress: (reason?: string) => doRemove(reason),
          },
        ],
        "plain-text",
      );
      return;
    }

    Alert.alert(
      "선생님 해제",
      `${student.name} 님을 선생님에서 해제할까요?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "해제",
          style: "destructive",
          onPress: async () => {
            setPromoting(true);
            try {
              await pivotStudioApi.removeStudioTeacher({
                studioId: activeStudio.id,
                teacherUserId: student.user_id!,
              });
              setIsTeacherOfStudio(false);
            } catch (e: any) {
              Alert.alert(
                "실패",
                e?.message ?? "잠시 후 다시 시도해 주세요.",
              );
            } finally {
              setPromoting(false);
            }
          },
        },
      ],
    );
  };

  const shareInvite = async () => {
    if (!student) return;
    const studio = studioName ? `\n요가원: ${studioName}` : "";
    const link = `onmatout://invite?code=${student.invite_code}`;
    await Share.share({
      message: `${student.name}님, 온매트아웃에서 함께해요${studio}\n\n초대 코드: ${student.invite_code}\n아래 링크를 누르면 바로 연결돼요 (앱 설치/로그인 필요)\n${link}`,
    }).catch(() => undefined);
  };

  if (loading || !student) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader onBack={() => navigation.goBack()} title="수련생" />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title="수련생"
        serif={false}
        trailing={{
          kind: "text",
          label: "수정",
          tone: "primary",
          onPress: () =>
            navigation.navigate("TeacherMemberEdit", {
              studentProfileId: student.id,
            }),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.text}
          />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{student.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName} numberOfLines={1}>
                {student.name}
              </Text>
              <StatusChip
                status={student.status as "active" | "paused" | "archived"}
                customLabel={(student as any).custom_status as string | null | undefined}
                size="md"
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.talkBtn}
            onPress={openYogaTalk}
            activeOpacity={0.8}
            accessibilityLabel="요가톡 시작"
          >
            <Ionicons name="chatbubbles" size={16} color={COLORS.white} />
            <Text style={styles.talkBtnLabel}>요가톡</Text>
          </TouchableOpacity>
        </View>

        {/* 연락처 + 메모 */}
        <SurfaceCard style={styles.card}>
          <View style={styles.joinChipRow}>
            {student.user_id ? (
              <View style={styles.linkChip}>
                <Ionicons
                  name="checkmark-circle"
                  size={11}
                  color={COLORS.success}
                />
                <Text style={styles.linkChipText}>앱 가입</Text>
              </View>
            ) : (
              <View style={styles.linkChipMuted}>
                <Ionicons name="hourglass" size={11} color={COLORS.warning} />
                <Text style={[styles.linkChipText, { color: COLORS.warning }]}>
                  가입 전
                </Text>
              </View>
            )}
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.contactText}>
              {student.phone ?? "전화번호 미수집"}
            </Text>
          </View>
          {student.memo ? (
            <View style={styles.memoBlock}>
              <Ionicons
                name="document-text-outline"
                size={13}
                color={COLORS.textMuted}
              />
              <Text style={styles.memo}>{student.memo}</Text>
            </View>
          ) : null}
        </SurfaceCard>

        {/* 선생님 승급 (원장만 노출) */}
        {isDirectorOfActive && student.user_id ? (
          <SurfaceCard style={styles.card}>
            <View style={styles.promoteRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoteTitle}>
                  {isTeacherOfStudio ? "선생님으로 등록됨" : "선생님으로 승급"}
                </Text>
                <Text style={styles.promoteDesc}>
                  {isTeacherOfStudio
                    ? "이 수련생은 현재 요가원의 선생님이에요. 출석, 수련생 관리를 도와줄 수 있어요."
                    : "이 수련생을 현재 요가원의 선생님으로 등록하면 출석, 수련생 관리를 함께 할 수 있어요."}
                </Text>
              </View>
              <Button
                title={isTeacherOfStudio ? "해제" : "승급"}
                size="small"
                variant={isTeacherOfStudio ? "secondary" : "primary"}
                loading={promoting}
                disabled={promoting}
                onPress={
                  isTeacherOfStudio ? demoteFromTeacher : promoteToTeacher
                }
              />
            </View>
          </SurfaceCard>
        ) : null}

        {/* Membership */}
        <View style={styles.section}>
          <SectionLabel
            trailing={
              <TouchableOpacity
                style={styles.sectionAction}
                onPress={() =>
                  navigation.navigate("TeacherMembershipCreate", {
                    studentProfileId: student.id,
                  })
                }
              >
                <Text style={styles.sectionActionText}>+ 발급</Text>
              </TouchableOpacity>
            }
          >
            수련권
          </SectionLabel>
          {membership ? (
            <SurfaceCard style={styles.card}>
              {/* Row 1: 요가원 칩(좌) + 유형 칩(우) */}
              <View style={styles.mClassRow}>
                {studioName ? (
                  <View style={styles.studioChip}>
                    <Text style={styles.studioChipText} numberOfLines={1}>
                      {studioName}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}
                <MembershipTypePill m={membership} />
              </View>
              {/* Row 2: 클래스 타이틀(좌) + 기간(우) */}
              <View style={styles.mTitleRow}>
                <Text style={styles.mClassTitle} numberOfLines={1}>
                  {membershipClass ? membershipClass.title : "전체 클래스 공통"}
                </Text>
                <Text style={styles.mDateRange}>
                  {membership.start_date.slice(5)} ~ {membership.end_date.slice(5)}
                </Text>
              </View>
              <MembershipBlock m={membership} />
              <TouchableOpacity
                style={styles.mAttendanceLink}
                onPress={() =>
                  navigation.navigate("TeacherMemberAttendance", {
                    studentProfileId: student.id,
                  })
                }
                activeOpacity={0.7}
              >
                <IconBadge name="list-outline" size={26} color={COLORS.primary} />
                <Text style={styles.mAttendanceLinkText}>
                  {attendance.length > 0
                    ? `이 수련권 출석 ${attendance.length}건 보기`
                    : "출석 내역 보기"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </SurfaceCard>
          ) : (
            <SurfaceCard style={styles.card}>
              <Text style={styles.empty}>활성 수련권이 없어요.</Text>
            </SurfaceCard>
          )}
        </View>

        {/* 초대 코드 카드 (앱 미가입 시만) - 화면 최하단 */}
        {!student.user_id ? (
          <View style={styles.section}>
            <SurfaceCard style={styles.inviteCard}>
              <View style={styles.inviteHead}>
                <Ionicons
                  name="mail-outline"
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.inviteCardLabel}>초대 코드</Text>
              </View>
              <View style={styles.inviteCodeRow}>
                <Text style={styles.inviteCardCode}>{student.invite_code}</Text>
                <TouchableOpacity
                  style={styles.inviteShareBtn}
                  onPress={shareInvite}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="share-outline"
                    size={13}
                    color={COLORS.primary}
                  />
                  <Text style={styles.inviteShareBtnText}>공유</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.qrWrap}>
                <View style={styles.qrBox}>
                  <QRCode
                    value={`onmatout://invite?code=${student.invite_code}`}
                    size={132}
                    backgroundColor="#FFFFFF"
                    color="#0A0A0A"
                  />
                </View>
                <Text style={styles.qrHint}>
                  수련생이 이 QR을 스캔하면 바로 연결돼요.
                </Text>
              </View>
            </SurfaceCard>
          </View>
        ) : null}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MembershipTypePill({ m }: { m: Membership }) {
  let icon: keyof typeof Ionicons.glyphMap = "ticket";
  let label = "횟수권";
  if (m.type === "period_weekly") {
    icon = "calendar";
    label = `기간권, 주 ${m.weekly_limit}회`;
  } else if (m.type === "period_unlimited") {
    icon = "infinite";
    label = "기간권, 무제한";
  }
  return (
    <View style={styles.mTypePill}>
      <Ionicons name={icon} size={11} color={COLORS.primary} />
      <Text style={styles.mTypePillText}>{label}</Text>
    </View>
  );
}

function MembershipBlock({ m }: { m: Membership }) {
  if (m.type === "count") {
    const total = m.total_count ?? 0;
    const pct = total > 0 ? Math.min(100, (m.used_count / total) * 100) : 0;
    return (
      <View style={{ gap: 6 }}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.mValue}>
          사용 {m.used_count}/{total}회
        </Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.md },
  section: { marginTop: SPACING.lg },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: 4,
    marginBottom: SPACING.md,
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: "800",
  },
  heroName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    flexShrink: 1,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  heroChips: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  joinChipRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  linkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(34, 197, 94, 0.14)",
  },
  linkChipMuted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(245, 158, 11, 0.14)",
  },
  linkChipText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  memoBlock: {
    flexDirection: "row",
    gap: 8,
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  memo: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  inviteCard: {
    marginBottom: SPACING.md,
    gap: 8,
  },
  qrWrap: {
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  qrBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  qrHint: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  inviteHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inviteCardLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  inviteCardCode: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
    paddingVertical: 2,
    flex: 1,
  },
  inviteCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inviteShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  inviteShareBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  metaLabel: { ...TEXT.caption, color: COLORS.textSecondary, width: 90 },
  promoteRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  promoteTitle: { ...TEXT.bodyMed, color: COLORS.text, marginBottom: 4 },
  promoteDesc: { ...TEXT.caption, color: COLORS.textSecondary, lineHeight: 18 },
  talkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.85)",
  },
  talkBtnLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  empty: { ...TEXT.caption, color: COLORS.textSecondary },
  sectionAction: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
  },
  sectionActionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },
  mContextLine: {
    ...TEXT.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  mClassRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  mTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  studioChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 160,
  },
  studioChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  mClassTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  mAttendanceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  mAttendanceLinkText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  mHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
  },
  mTypePillText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  mDateRange: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  mValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  mTitle: { ...TEXT.caption, color: COLORS.textSecondary, marginBottom: 4 },
  mMeta: { ...TEXT.caption, color: COLORS.textSecondary, marginTop: 4 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: SPACING.md,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  linkSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  attendanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  attendanceDate: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  attendancePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  attendancePillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  deductedMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  deductedMiniText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },
});
