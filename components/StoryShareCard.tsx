import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { PixelRatio, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/Colors";
import { getAsanaThumbnailSource } from "../lib/asanaImages";
import { formatDateLetter } from "../lib/utils/dateFormatter";
import { Record } from "../types/record";

/** 인스타 스토리 비율 9:16. 논리 픽셀 기준, 캡처 시 PixelRatio 적용 */
export const STORY_CARD_WIDTH = 360;
export const STORY_CARD_HEIGHT = 720;

export type StoryStatsData = {
  totalCount: number;
  weekCount: number;
  monthCount: number;
  userName?: string;
  /** 수련한 아사나 이미지 번호 목록 (배경 장식용, 랜덤 배치) */
  backgroundAsanaImageNumbers?: string[];
};

export type StorySequenceData = {
  title: string;
  asanas: {
    image_number: string | null;
    name: string;
    category_name_en?: string | null;
  }[];
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
    }
  | {
      mode: "sequence";
      sequence: StorySequenceData;
    };

export default function StoryShareCard(props: StoryShareCardProps) {
  if (props.mode === "stats") {
    return <StoryStatsCard stats={props.stats} />;
  }
  if (props.mode === "sequence") {
    return <StorySequenceCard sequence={props.sequence} />;
  }
  return <StoryRecordCard record={props.record} userName={props.userName} />;
}

const SEQ_COLS = 3;
const SEQ_ARROW_W = 18;

function StorySequenceCard({ sequence }: { sequence: StorySequenceData }) {
  const list = sequence.asanas ?? [];
  const n = list.length;

  // 카드 크기: 가로(3열) + 세로 가용공간에 맞춰 동적으로 축소 (스네이크 그리드)
  const contentW = STORY_CARD_WIDTH - 44;
  const cardW = Math.floor((contentW - SEQ_ARROW_W * (SEQ_COLS - 1)) / SEQ_COLS);
  const rowCount = Math.max(1, Math.ceil(n / SEQ_COLS));
  const availH = STORY_CARD_HEIGHT - 170 - 92; // 헤더 + 푸터 영역 제외
  const nameH = 18;
  const cardFromH = Math.floor((availH - rowCount * 18) / rowCount) - nameH;
  const cardSize = Math.max(40, Math.min(cardW, cardFromH));
  const gridW = cardSize * SEQ_COLS + SEQ_ARROW_W * (SEQ_COLS - 1);

  const rows: StorySequenceData["asanas"][] = [];
  for (let i = 0; i < n; i += SEQ_COLS) rows.push(list.slice(i, i + SEQ_COLS));

  return (
    <View style={[styles.card, styles.seqCard]} collapsable={false}>
      {/* 배경 장식 */}
      <View style={styles.seqBlobA} />
      <View style={styles.seqBlobB} />

      <View style={styles.seqHeader}>
        <View style={styles.seqAccent} />
        <Text style={styles.seqTitle} numberOfLines={2}>
          {sequence.title}
        </Text>
      </View>

      <View style={styles.seqGridWrap}>
        {rows.map((row, rowIdx) => {
          const reverse = rowIdx % 2 === 1;
          const lastRow = rowIdx === rows.length - 1;
          return (
            <React.Fragment key={rowIdx}>
              <View
                style={[
                  styles.seqRow,
                  { width: gridW },
                  reverse && { flexDirection: "row-reverse" },
                ]}
              >
                {row.map((a, ci) => {
                  const thumb = getAsanaThumbnailSource(a.image_number);
                  const lastInRow = ci === row.length - 1;
                  return (
                    <React.Fragment key={ci}>
                      <View style={{ width: cardSize }}>
                        <View
                          style={[
                            styles.seqTile,
                            { width: cardSize, height: cardSize },
                          ]}
                        >
                          {thumb ? (
                            <Image
                              source={thumb}
                              style={styles.seqImg}
                              contentFit="contain"
                            />
                          ) : (
                            <Text style={styles.seqFallback}>
                              {a.name.charAt(0)}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.seqName} numberOfLines={1}>
                          {a.name}
                        </Text>
                      </View>
                      {!lastInRow ? (
                        <View
                          style={[
                            styles.seqArrow,
                            { width: SEQ_ARROW_W, height: cardSize },
                          ]}
                        >
                          <Ionicons
                            name={reverse ? "chevron-back" : "chevron-forward"}
                            size={14}
                            color="rgba(139, 92, 246, 0.9)"
                          />
                        </View>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </View>
              {!lastRow ? (
                <View style={styles.seqDownRow}>
                  <View style={[styles.seqDownCell, { width: cardSize }]}>
                    {reverse ? (
                      <Ionicons
                        name="chevron-down"
                        size={14}
                        color="rgba(139, 92, 246, 0.9)"
                      />
                    ) : null}
                  </View>
                  <View style={{ width: SEQ_ARROW_W }} />
                  <View style={[styles.seqDownCell, { width: cardSize }]} />
                  <View style={{ width: SEQ_ARROW_W }} />
                  <View style={[styles.seqDownCell, { width: cardSize }]}>
                    {!reverse ? (
                      <Ionicons
                        name="chevron-down"
                        size={14}
                        color="rgba(139, 92, 246, 0.9)"
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.seqFooter}>
        <Image
          source={require("../images/onthemat_rm_bg.png")}
          style={styles.bottomLogo}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

function StoryStatsCard({ stats }: { stats: StoryStatsData }) {
  return (
    <View style={[styles.card, styles.statsCard]} collapsable={false}>
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
              const src = getAsanaThumbnailSource(a?.image_number);
              const n = asanaList.length;
              const thumbStyle =
                n <= 4
                  ? styles.recordAsanaThumbSingle
                  : n > 8
                    ? styles.recordAsanaThumbSmall
                    : styles.recordAsanaThumb;
              return (
                <View key={i} style={[styles.recordAsanaThumbBase, thumbStyle]}>
                  {src ? (
                    <Image
                      source={src}
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

      {/* 날짜, 닉네임: 우측 끝 정렬 */}
      {dateStr ? (
        <View style={styles.recordFooterColumn}>
          <Text style={styles.recordSignature}>{signature}</Text>
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
  seqCard: {
    backgroundColor: "#0B0B0F",
    overflow: "hidden",
  },
  seqBlobA: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(139, 92, 246, 0.22)",
  },
  seqBlobB: {
    position: "absolute",
    bottom: -70,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(99, 102, 241, 0.16)",
  },
  seqHeader: {
    paddingTop: 56,
    paddingHorizontal: 28,
    paddingBottom: 6,
    alignItems: "center",
    zIndex: 1,
  },
  seqAccent: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginBottom: 14,
  },
  seqTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  seqGridWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  seqRow: { flexDirection: "row", alignItems: "flex-start" },
  seqTile: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 7,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  seqNumBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  seqNumText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  seqImg: { width: "100%", height: "100%" },
  seqFallback: { color: "#2D2421", fontSize: 22, fontWeight: "600" },
  seqName: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 5,
  },
  seqArrow: { alignItems: "center", justifyContent: "center" },
  seqDownRow: { flexDirection: "row", paddingVertical: 2 },
  seqDownCell: { alignItems: "center", justifyContent: "center" },
  seqFooter: {
    paddingBottom: 30,
    paddingTop: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  seqFooterMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
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
