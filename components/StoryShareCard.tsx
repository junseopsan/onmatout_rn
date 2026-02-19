import { Image } from "expo-image";
import React from "react";
import { PixelRatio, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { STATES } from "../constants/states";
import { formatDateLetter } from "../lib/utils/dateFormatter";
import { Record } from "../types/record";

/** 인스타 스토리 비율 9:16. 논리 픽셀 기준, 캡처 시 PixelRatio 적용 */
export const STORY_CARD_WIDTH = 360;
export const STORY_CARD_HEIGHT = 720;

export type StoryCardMode = "stats" | "record";

export type StoryStatsData = {
  totalCount: number;
  weekCount: number;
  monthCount: number;
  userName?: string;
  /** 수련한 아사나 이미지 번호 목록 (배경 장식용, 랜덤 배치) */
  backgroundAsanaImageNumbers?: string[];
};

type StoryShareCardProps =
  | {
      mode: "stats";
      stats: StoryStatsData;
    }
  | {
      mode: "record";
      record: Record;
      userName?: string;
    };

function getStateInfo(stateId: string) {
  return STATES.find((x) => x.id === stateId);
}

export default function StoryShareCard(props: StoryShareCardProps) {
  if (props.mode === "stats") {
    return <StoryStatsCard stats={props.stats} />;
  }
  return <StoryRecordCard record={props.record} userName={props.userName} />;
}

// 통계 카드 배경용 랜덤 위치 (고정 시드로 캡처 시 동일하게 나오도록)
const STATS_BG_POSITIONS = [
  { left: 8, top: 60 },
  { right: 8, top: 100 },
  { left: 12, top: 220 },
  { right: 12, top: 260 },
  { left: 4, top: 380 },
  { right: 4, top: 420 },
  { left: 20, top: 520 },
  { right: 20, top: 560 },
  { left: 28, top: 140 },
  { right: 28, top: 320 },
  { left: 16, top: 480 },
  { right: 16, top: 640 },
];

function StoryStatsCard({ stats }: { stats: StoryStatsData }) {
  const bgAsanas = stats.backgroundAsanaImageNumbers ?? [];
  const bgList = bgAsanas.slice(0, STATS_BG_POSITIONS.length);

  return (
    <View style={[styles.card, styles.statsCard]} collapsable={false}>
      {/* 배경: 수련한 아사나 이미지 랜덤 배치 (로딩 시간 이슈로 임시 비표시) */}
      {/* {bgList.length > 0 ? (
        <View style={styles.statsBgLayer} pointerEvents="none">
          {bgList.map((imageNumber, i) => {
            const pos = STATS_BG_POSITIONS[i];
            const url = `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${String(imageNumber).padStart(3, "0")}.png`;
            return (
              <View
                key={`${imageNumber}-${i}`}
                style={[styles.statsBgThumb, pos]}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.statsBgThumbImg}
                  contentFit="contain"
                />
              </View>
            );
          })}
        </View>
      ) : null} */}

      {/* 상단: ○○님의 수련 (크게) */}
      {stats.userName ? (
        <View style={styles.statsTopTitle}>
          <Text style={styles.statsUserName}>{stats.userName}님의 수련</Text>
        </View>
      ) : null}
      <View style={styles.statsContent}>
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{stats.totalCount}</Text>
          <Text style={styles.statLabel}>총 수련</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{stats.weekCount}</Text>
          <Text style={styles.statLabel}>이번 주</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statValue}>{stats.monthCount}</Text>
          <Text style={styles.statLabel}>이번 달</Text>
        </View>
      </View>
      <View style={[styles.bottomBar, { zIndex: 1 }]}>
        <Image
          source={require("../images/onthemat_rm_bg.png")}
          style={styles.bottomLogo}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

function getAsanaImageUrl(asana: any): string | null {
  const n = asana && typeof asana === "object" && asana.image_number;
  if (!n) return null;
  return `https://ueoytttgsjquapkaerwk.supabase.co/storage/v1/object/public/asanas-images/thumbnail/${String(n).padStart(3, "0")}.png`;
}

function StoryRecordCard({
  record,
  userName,
}: {
  record: Record;
  userName?: string;
}) {
  const dateStr = formatDateLetter(
    record.practice_date || record.date || record.created_at,
  );
  const asanas = record.asanas || [];
  const asanaList = Array.isArray(asanas) ? asanas : [];
  const states = record.states || [];
  const memo = (record.memo || "").trim();
  const signature =
    userName != null && userName.trim() !== ""
      ? `${dateStr} ${userName.trim()}`
      : dateStr;

  return (
    <View style={[styles.card, styles.recordCard]} collapsable={false}>
      <View style={styles.recordTopBar}>
        <Text style={styles.recordSubtitle}>수련 기록</Text>
      </View>
      <View style={styles.recordBody}>
        {/* 아사나: 1개 100px, 2~8개 80px, 9개+ 52px */}
        {asanaList.length > 0 ? (
          <View style={styles.recordAsanaRow}>
            {asanaList.map((a: any, i: number) => {
              const url = getAsanaImageUrl(a);
              const n = asanaList.length;
              const thumbStyle =
                n <= 4
                  ? styles.recordAsanaThumbSingle
                  : n > 8
                    ? styles.recordAsanaThumbSmall
                    : styles.recordAsanaThumb;
              return (
                <View key={i} style={[styles.recordAsanaThumbBase, thumbStyle]}>
                  {url ? (
                    <Image
                      source={{ uri: url }}
                      style={styles.recordAsanaThumbImg}
                      contentFit="contain"
                    />
                  ) : (
                    <View style={styles.recordAsanaThumbPlaceholder} />
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* 메모: 전체 노출, 작은 글씨로 다 보이게 */}
        {memo ? <Text style={styles.recordMemo}>{memo}</Text> : null}
      </View>

      {/* 감정(위, 색상 칩) + 날짜·닉네임(아래): 우측 끝 정렬 */}
      {states.length > 0 || dateStr ? (
        <View style={styles.recordFooterColumn}>
          {states.length > 0 ? (
            <View style={styles.recordStateChipsRow}>
              {states.map((stateId: string) => {
                const state = getStateInfo(stateId);
                if (!state) return null;
                return (
                  <View
                    key={stateId}
                    style={[
                      styles.recordStateChip,
                      {
                        borderColor: state.color,
                        backgroundColor: `${state.color}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recordStateChipText,
                        { color: state.color },
                      ]}
                    >
                      {state.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
          {dateStr ? (
            <Text style={styles.recordSignature}>{signature}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.bottomBar}>
        <Image
          source={require("../images/onthemat_rm_bg.png")}
          style={styles.bottomLogo}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: STORY_CARD_WIDTH,
    height: STORY_CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
  },
  statsCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
    overflow: "hidden",
  },
  statsBgLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  statsBgThumb: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 0,
  },
  statsBgThumbImg: {
    width: "90%",
    height: "90%",
    opacity: 0.2,
  },
  recordCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  topBar: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsTopTitle: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: "center",
    zIndex: 1,
  },
  statsUserName: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
  },
  statsContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    zIndex: 1,
  },
  userName: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  statRow: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 44,
    fontWeight: "800",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  recordTopBar: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 12,
    alignItems: "center",
  },
  recordAppName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 1,
  },
  recordSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 2,
  },
  recordBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  recordAsanaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  recordAsanaThumbBase: {
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  recordAsanaThumbSingle: {
    width: 100,
    height: 100,
  },
  recordAsanaThumb: {
    width: 80,
    height: 80,
  },
  recordAsanaThumbSmall: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  recordAsanaThumbImg: {
    width: "100%",
    height: "100%",
  },
  recordAsanaThumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  recordMemo: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
    maxHeight: 340,
    paddingBottom: 12,
  },
  recordFooterColumn: {
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 10,
    gap: 6,
  },
  recordStateChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
  },
  recordStateChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  recordStateChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  recordSignature: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "right",
  },
  bottomBar: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomLogo: {
    width: 88,
    height: 24,
  },
});

export function getStoryCaptureOptions() {
  const ratio = PixelRatio.get();
  return {
    format: "png" as const,
    quality: 1,
    width: STORY_CARD_WIDTH * ratio,
    height: STORY_CARD_HEIGHT * ratio,
    result: "tmpfile" as const,
  };
}
