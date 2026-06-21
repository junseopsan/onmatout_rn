import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { COLORS } from "../../constants/Colors";
import { RADIUS, SPACING } from "../../constants/Design";
import type { MembershipPlan } from "../../lib/api/membershipPlans";
import type {
  MyMembershipInfo,
  StudioFullInfo,
} from "../../lib/api/studentBooking";
import { formatValidDays } from "../../lib/format";
import { haptics } from "../../lib/haptics";
import { Sheet } from "../ui/Sheet";

interface Props {
  studio: StudioFullInfo;
  memberships: MyMembershipInfo[];
  plans?: MembershipPlan[];
}

function planSummary(p: MembershipPlan): string {
  const parts: string[] = [];
  if (p.duration_min) parts.push(`${p.duration_min}분`);
  if (p.type === "count" && p.total_count) parts.push(`${p.total_count}회`);
  if (p.type === "period_weekly" && p.weekly_limit)
    parts.push(`주 ${p.weekly_limit}회`);
  if (p.type === "period_unlimited") parts.push("무제한");
  if (p.valid_days) parts.push(`사용기한 ${formatValidDays(p.valid_days)}`);
  return parts.join(", ");
}

function typeLabel(m: MyMembershipInfo): string {
  if (m.type === "count") return "횟수권";
  if (m.type === "period_weekly") return `주${m.weekly_limit ?? ""}회`;
  if (m.type === "period_unlimited") return "무제한";
  return "수강권";
}

function remainingText(m: MyMembershipInfo): string | null {
  if (m.type === "count" && m.total_count != null) {
    const used = m.used_count ?? 0;
    return `${m.total_count - used}/${m.total_count}`;
  }
  return null;
}

function daysLeft(end: string | null): number | null {
  if (!end) return null;
  const e = new Date(end + "T23:59:59");
  const now = new Date();
  return Math.max(0, Math.ceil((e.getTime() - now.getTime()) / 86400000));
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  return d.replaceAll("-", ".");
}

function instaHandle(v: string): string {
  const s = v.trim();
  if (s.startsWith("@")) return s;
  const stripped = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const m = stripped.match(/instagram\.com\/([^/?#]+)/i);
  const handle = m ? m[1] : (stripped.replace(/\/+$/, "").split("/").pop() ?? s);
  return `@${handle.replace(/^@/, "")}`;
}

function displayUrl(v: string): string {
  return v
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function callPhone(num: string) {
  haptics.select();
  Linking.openURL(`tel:${num.replace(/[^\d+]/g, "")}`).catch(() => undefined);
}
function openUrl(url: string) {
  haptics.select();
  const u = url.startsWith("http") ? url : `https://${url}`;
  Linking.openURL(u).catch(() => undefined);
}

const DAY_ORDER: { key: string; label: string }[] = [
  { key: "1", label: "월" },
  { key: "2", label: "화" },
  { key: "3", label: "수" },
  { key: "4", label: "목" },
  { key: "5", label: "금" },
  { key: "6", label: "토" },
  { key: "0", label: "일" },
];

type TabKey = "mine" | "studio" | "classes";

export function StudioInfoCard({ studio, memberships, plans = [] }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("mine");
  const hasContact =
    !!studio.phone ||
    !!studio.instagram_url ||
    !!studio.kakao_url ||
    !!studio.website_url;
  const hasPricing =
    plans.length > 0 || !!studio.pricing_text || !!studio.pricing_image_url;
  const hasPolicy =
    !!studio.policy_text ||
    !!studio.policy_image_url ||
    !!studio.rules_image_url;
  const hasIntro = !!studio.description || !!studio.description_image_url;
  const hourRows = DAY_ORDER.filter((d) => studio.hours_by_day?.[d.key]);
  const hasOps = hourRows.length > 0;
  const hasPhotos = studio.photos.length > 0;
  // 요가원 탭은 기본 정보만 (주소/소개/운영/사진/연락처). 수업권 안내·등록/예약·계좌는 수업 탭으로 분리.
  const hasStudioInfo =
    !!studio.location || hasIntro || hasOps || hasPhotos || hasContact;

  return (
    <>
      <Pressable
        style={styles.infoBtn}
        onPress={() => {
          haptics.select();
          setOpen(true);
        }}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={COLORS.primary}
        />
        <Text style={styles.infoBtnText}>정보</Text>
      </Pressable>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title={studio.name}
        heightPct={0.75}
      >
        <View style={styles.tabBar}>
          {(
            [
              { key: "mine", label: "내 수련권" },
              { key: "studio", label: "요가원" },
              { key: "classes", label: "수업" },
            ] as { key: TabKey; label: string }[]
          ).map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tabItem, tab === t.key && styles.tabItemOn]}
              onPress={() => {
                haptics.select();
                setTab(t.key);
              }}
            >
              <Text
                style={[styles.tabText, tab === t.key && styles.tabTextOn]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "mine" ? (
          memberships.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>아직 발급받은 수련권이 없어요.</Text>
              <Text style={styles.emptySub}>
                수련권이 필요하면 요가원에 문의해 주세요.
              </Text>
            </View>
          ) : (
            memberships.map((m) => {
              const rem = remainingText(m);
              const left = daysLeft(m.end_date);
              return (
                <View key={m.id} style={styles.passCard}>
                  <View style={styles.passTop}>
                    <Text style={styles.passType}>{typeLabel(m)}</Text>
                    {m.class_title ? (
                      <Text style={styles.passClass} numberOfLines={1}>
                        {m.class_title}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.statRow}>
                    {rem ? (
                      <Stat label="잔여" value={`${rem}회`} highlight />
                    ) : null}
                    {m.start_date && m.end_date ? (
                      <Stat
                        label="기간"
                        value={`${fmtDate(m.start_date)} ~ ${fmtDate(m.end_date)}`}
                      />
                    ) : null}
                    {left != null ? (
                      <Stat label="남은 기간" value={`${left}일`} />
                    ) : null}
                  </View>
                </View>
              );
            })
          )
        ) : null}

        {tab === "studio" && !hasStudioInfo ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>등록된 안내가 없어요.</Text>
          </View>
        ) : null}

        {tab === "studio" && hasPhotos ? (
          <PhotoSlider photos={studio.photos} />
        ) : null}

        {tab === "studio" && hasIntro ? (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>소개</Text>
            {studio.description ? (
              <Text style={styles.guideBody}>{studio.description}</Text>
            ) : null}
            {studio.description_image_url ? (
              <Image
                source={{ uri: studio.description_image_url }}
                style={styles.guideImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        ) : null}

        {tab === "studio" && studio.location ? (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>주소</Text>
            {studio.map_url ? (
              <Pressable
                style={styles.ruleLine}
                onPress={() => openUrl(studio.map_url!)}
              >
                <Ionicons
                  name="location-outline"
                  size={15}
                  color={COLORS.primary}
                />
                <Text
                  style={[
                    styles.guideBody,
                    { flex: 1, color: COLORS.primary, fontWeight: "700" },
                  ]}
                >
                  {studio.location}
                </Text>
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={COLORS.primary}
                />
              </Pressable>
            ) : (
              <View style={styles.ruleLine}>
                <Ionicons
                  name="location-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />
                <Text style={[styles.guideBody, { flex: 1 }]}>
                  {studio.location}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {tab === "studio" && hasOps ? (
          <View style={styles.guideSection}>
            <Text style={styles.guideTitle}>운영 안내</Text>
            <View style={styles.hourGrid}>
              {hourRows.map((d) => (
                <View key={d.key} style={styles.hourRow}>
                  <Text style={styles.hourDay}>{d.label}</Text>
                  <Text style={styles.hourVal} numberOfLines={1}>
                    {studio.hours_by_day?.[d.key]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}


        {tab === "studio" && hasContact ? (
          <View style={styles.actionsRow}>
            {studio.phone ? (
              <Pressable
                onPress={() => callPhone(studio.phone!)}
                style={styles.actionBtn}
              >
                <Ionicons name="call" size={15} color={COLORS.text} />
                <Text style={styles.actionText} numberOfLines={1}>
                  {studio.phone}
                </Text>
              </Pressable>
            ) : null}
            {studio.kakao_url ? (
              <Pressable
                onPress={() => openUrl(studio.kakao_url!)}
                style={styles.actionBtn}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={15}
                  color="#FAE100"
                />
                <Text style={styles.actionText} numberOfLines={1}>
                  카카오톡
                </Text>
              </Pressable>
            ) : null}
            {studio.instagram_url ? (
              <Pressable
                onPress={() => openUrl(studio.instagram_url!)}
                style={styles.actionBtn}
              >
                <Ionicons name="logo-instagram" size={15} color="#E1306C" />
                <Text style={styles.actionText} numberOfLines={1}>
                  {instaHandle(studio.instagram_url)}
                </Text>
              </Pressable>
            ) : null}
            {studio.website_url ? (
              <Pressable
                onPress={() => openUrl(studio.website_url!)}
                style={styles.actionBtn}
              >
                <Ionicons name="globe-outline" size={15} color={COLORS.text} />
                <Text style={styles.actionText} numberOfLines={1}>
                  {displayUrl(studio.website_url)}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {tab === "classes" ? (
          <>
            {studio.bank_account ? (
              <View style={styles.accountBox}>
                <View style={styles.accountHeader}>
                  <Ionicons
                    name="card-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                  <Text style={styles.accountLabel}>계좌번호</Text>
                </View>
                <Text style={styles.accountValue} selectable>
                  {studio.bank_account}
                </Text>
              </View>
            ) : null}

            {hasPricing ? (
              <View style={styles.guideSection}>
                <Text style={styles.guideTitle}>수업권 안내</Text>
                <Text style={styles.guideSubtitle}>
                  이 요가원에서 운영하는 수강권 종류예요.
                </Text>
                {plans.map((p) => (
                  <View key={p.id} style={styles.planLine}>
                    {p.image_url ? (
                      <Image
                        source={{ uri: p.image_url }}
                        style={styles.planThumb}
                      />
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{p.name}</Text>
                      <Text style={styles.planSummary}>{planSummary(p)}</Text>
                    </View>
                    {p.price != null ? (
                      <Text style={styles.planPrice}>
                        {p.price.toLocaleString("en-US")}원
                      </Text>
                    ) : null}
                  </View>
                ))}
                {studio.pricing_text ? (
                  <Text
                    style={[
                      styles.guideBody,
                      plans.length > 0 && { marginTop: 10 },
                    ]}
                  >
                    {studio.pricing_text}
                  </Text>
                ) : null}
                {studio.pricing_image_url ? (
                  <Image
                    source={{ uri: studio.pricing_image_url }}
                    style={styles.guideImage}
                    resizeMode="contain"
                  />
                ) : null}
                {studio.cancel_cutoff_hours > 0 ? (
                  <View style={[styles.ruleLine, { marginTop: 10 }]}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={COLORS.warning}
                    />
                    <Text style={styles.ruleText}>
                      수업 시작 {studio.cancel_cutoff_hours}시간 전까지 취소 가능
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : !studio.bank_account ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.empty}>등록된 수업권이 없어요.</Text>
              </View>
            ) : null}

            {hasPolicy ? (
              <View style={styles.guideSection}>
                <Text style={styles.guideTitle}>등록/예약 안내</Text>
                {studio.policy_text ? (
                  <Text style={styles.guideBody}>{studio.policy_text}</Text>
                ) : null}
                {studio.policy_image_url ? (
                  <Image
                    source={{ uri: studio.policy_image_url }}
                    style={styles.guideImage}
                    resizeMode="contain"
                  />
                ) : null}
                {studio.rules_image_url ? (
                  <Image
                    source={{ uri: studio.rules_image_url }}
                    style={styles.guideImage}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}
      </Sheet>
    </>
  );
}

function PhotoSlider({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0);
  // 시트 본문은 좌우 SPACING.xl 패딩이 있으므로 슬라이드 폭을 거기에 맞춘다.
  const width = Dimensions.get("window").width - SPACING.xl * 2;
  return (
    <View style={styles.sliderWrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIdx(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {photos.map((url) => (
          <Image
            key={url}
            source={{ uri: url }}
            style={{ width, height: 200, borderRadius: 12 }}
          />
        ))}
      </ScrollView>
      {photos.length > 1 ? (
        <View style={styles.dotsRow}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHi]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  infoBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: COLORS.surfaceDark,
    borderRadius: RADIUS.pill,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  tabItemOn: {
    backgroundColor: "rgba(139, 92, 246, 0.18)",
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextOn: {
    color: COLORS.primary,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  empty: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  accountBox: {
    backgroundColor: "rgba(139, 92, 246, 0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  accountLabel: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  accountValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  passCard: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  passTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passType: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  passClass: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  stat: { gap: 2 },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statValueHi: { color: COLORS.primary, fontSize: 16, fontWeight: "800" },
  guideSection: {
    backgroundColor: COLORS.surfaceDark,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  guideTitle: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  guideSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
  },
  guideBody: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  planLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  planThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: COLORS.surface,
  },
  planName: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  planSummary: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  planPrice: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  ruleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  ruleText: { color: COLORS.warning, fontSize: 12, fontWeight: "700" },
  guideImage: {
    width: "100%",
    height: 420,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: COLORS.surface,
  },
  sliderWrap: { marginBottom: 14 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotOn: {
    backgroundColor: COLORS.primary,
    width: 18,
  },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    width: "48%",
  },
  hourDay: {
    width: 40,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  hourVal: { flex: 1, color: COLORS.text, fontSize: 13 },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
