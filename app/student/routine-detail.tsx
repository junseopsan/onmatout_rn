import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DetailHeader } from "../../components/ui/DetailHeader";
import { Button } from "../../components/ui/Button";
import { SectionLabel } from "../../components/ui/SectionLabel";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { COLORS } from "../../constants/Colors";
import { CATEGORIES } from "../../constants/categories";
import { SPACING } from "../../constants/Design";
import { TEXT } from "../../constants/Typography";
import { useAuth } from "../../hooks/useAuth";
import { studentRoutinesApi } from "../../lib/api/routines-student";
import { getAsanaThumbnailSource } from "../../lib/asanaImages";
import type { AsanaCategory } from "../../types/asana";
import { RootStackParamList } from "../../navigation/types";
import type { Routine, RoutineItem } from "../../types/teacher";

const GRID_COLS = 3;
const ARROW_W = 22;
const SCREEN_W = Dimensions.get("window").width;
const CARD_SIZE = Math.floor(
  (SCREEN_W - SPACING.lg * 2 - ARROW_W * (GRID_COLS - 1)) / GRID_COLS,
);

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, "StudentRoutineDetail">;

type ItemWithAsana = RoutineItem & {
  asanas: {
    id: string;
    sanskrit_name_kr: string;
    sanskrit_name_en: string;
    image_number: string | null;
    category_name_en: string | null;
  };
};

export default function StudentRoutineDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { user } = useAuth();
  const { routineId } = route.params;
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<ItemWithAsana[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { routine: r, items: it } = await studentRoutinesApi.getRoutine(
          routineId,
        );
        if (mounted) {
          setRoutine(r);
          setItems(it as ItemWithAsana[]);
        }
      } catch (e) {
        console.warn("[StudentRoutineDetail] failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [routineId]);

  const isOwner = routine?.teacher_id === user?.id;

  const cloneToMyRoutines = async () => {
    if (!routine) return;
    setCloning(true);
    try {
      const newId = await studentRoutinesApi.cloneRoutine(routine.id);
      Alert.alert("내 시퀀스으로 가져왔어요", "언제든 다시 꺼내볼 수 있어요.", [
        {
          text: "보기",
          onPress: () =>
            navigation.replace("StudentRoutineDetail", { routineId: newId }),
        },
        { text: "닫기", style: "cancel" },
      ]);
    } catch (e: any) {
      Alert.alert("복제 실패", e?.message ?? "다시 시도해 주세요.");
    } finally {
      setCloning(false);
    }
  };

  if (loading || !routine) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <DetailHeader onBack={() => navigation.goBack()} title="시퀀스" serif={false} />
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <DetailHeader
        onBack={() => navigation.goBack()}
        title={routine.title}
        serif={false}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {routine.description ? (
          <SurfaceCard style={styles.card}>
            <Text style={styles.description}>{routine.description}</Text>
          </SurfaceCard>
        ) : null}

        {!isOwner ? (
          <Button
            title="내 시퀀스로 가져오기"
            size="large"
            loading={cloning}
            onPress={cloneToMyRoutines}
            prefix={
              <Ionicons
                name="duplicate-outline"
                size={18}
                color={COLORS.white}
              />
            }
            style={{ marginBottom: SPACING.md }}
          />
        ) : null}

        <View style={styles.section}>
          <SectionLabel>아사나 시퀀스 ({items.length})</SectionLabel>
          <View style={styles.grid}>
            {(() => {
              const rows: ItemWithAsana[][] = [];
              for (let i = 0; i < items.length; i += GRID_COLS) {
                rows.push(items.slice(i, i + GRID_COLS));
              }
              return rows.map((row, rowIdx) => {
              const isReverse = rowIdx % 2 === 1;
              const isLastRow = rowIdx === rows.length - 1;
              return (
                <React.Fragment key={`row-${rowIdx}`}>
                  <View
                    style={[
                      styles.gridRow,
                      isReverse && { flexDirection: "row-reverse" },
                    ]}
                  >
                    {row.map((it, ci) => {
                      const thumb = getAsanaThumbnailSource(
                        it.asanas.image_number,
                      );
                      const cat = it.asanas.category_name_en
                        ? CATEGORIES[
                            it.asanas.category_name_en as AsanaCategory
                          ]
                        : null;
                      const isLastInRow = ci === row.length - 1;
                      return (
                        <React.Fragment key={it.id}>
                          <TouchableOpacity
                            style={styles.gridCard}
                            onPress={() =>
                              navigation.navigate("AsanaDetail", {
                                id: it.asanas.id,
                              })
                            }
                            activeOpacity={0.85}
                          >
                            {cat ? (
                              <View
                                style={[
                                  styles.gridCatBadge,
                                  { backgroundColor: `${cat.color}CC` },
                                ]}
                              >
                                <Text
                                  style={styles.gridCatText}
                                  numberOfLines={1}
                                >
                                  {cat.label}
                                </Text>
                              </View>
                            ) : null}
                            <View style={styles.gridImgWrap}>
                              {thumb ? (
                                <Image
                                  source={thumb}
                                  style={styles.gridImg}
                                  contentFit="contain"
                                />
                              ) : (
                                <Text style={styles.gridFallback}>
                                  {it.asanas.sanskrit_name_kr.charAt(0)}
                                </Text>
                              )}
                            </View>
                            <Text style={styles.gridName} numberOfLines={1}>
                              {it.asanas.sanskrit_name_kr}
                            </Text>
                          </TouchableOpacity>
                          {!isLastInRow ? (
                            <View style={styles.gridArrow}>
                              <Ionicons
                                name={
                                  isReverse
                                    ? "chevron-back"
                                    : "chevron-forward"
                                }
                                size={18}
                                color={COLORS.text}
                              />
                            </View>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </View>
                  {!isLastRow ? (
                    <View style={styles.gridDownRow}>
                      <View style={styles.gridDownCell}>
                        {isReverse ? (
                          <Ionicons
                            name="chevron-down"
                            size={18}
                            color={COLORS.text}
                          />
                        ) : null}
                      </View>
                      <View style={{ width: ARROW_W }} />
                      <View style={styles.gridDownCell} />
                      <View style={{ width: ARROW_W }} />
                      <View style={styles.gridDownCell}>
                        {!isReverse ? (
                          <Ionicons
                            name="chevron-down"
                            size={18}
                            color={COLORS.text}
                          />
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </React.Fragment>
              );
              });
            })()}
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xxl },
  card: { marginBottom: SPACING.md },
  description: { ...TEXT.body, color: COLORS.text, lineHeight: 22 },
  section: { marginTop: SPACING.lg },
  itemsCard: { overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  rowIndex: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    width: 22,
    textAlign: "center",
  },
  rowName: { ...TEXT.bodyMed, color: COLORS.text },
  rowEn: { ...TEXT.caption, color: COLORS.textSecondary, marginTop: 2 },
  grid: {
    width: "100%",
  },
  gridRow: {
    flexDirection: "row",
    width: "100%",
  },
  gridArrow: {
    width: ARROW_W,
    height: CARD_SIZE + 18,
    alignItems: "center",
    justifyContent: "center",
  },
  gridDownRow: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 4,
  },
  gridDownCell: {
    width: CARD_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCard: {
    width: CARD_SIZE,
    height: CARD_SIZE + 18,
    borderRadius: 12,
    backgroundColor: "#F5F0E8",
    padding: 6,
    position: "relative",
    overflow: "hidden",
  },
  gridImgWrap: {
    flex: 1,
    width: "100%",
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridImg: { width: "100%", height: "100%" },
  gridFallback: {
    color: "#2D2421",
    fontSize: 28,
    fontWeight: "600",
  },
  gridName: {
    color: "#2D2421",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 2,
    paddingHorizontal: 2,
  },
  gridCatBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 60,
    zIndex: 2,
  },
  gridCatText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
});
