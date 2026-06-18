import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/Button";
import { COLORS } from "../constants/Colors";
import { SPACING } from "../constants/Design";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");

type Slide = {
  key: string;
  kicker: string;
  roles?: boolean;
  title: string;
  desc: string;
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    kicker: "ONMATOUT",
    title: "요가를 일상으로,\n온매트아웃",
    desc: "수련 기록부터 선생님과의 연결까지\n요가 생활을 한 곳에서 이어가세요.",
  },
  {
    key: "roles",
    kicker: "역할",
    roles: true,
    title: "수련생,\n그리고 선생님",
    desc: "누구나 수련생으로 시작해요.\n요가원을 운영한다면 언제든 선생님 역할을 더할 수 있어요.",
  },
  {
    key: "care",
    kicker: "케어",
    title: "선생님과 함께",
    desc: "출석 체크, 수업권, 복습 시퀀스까지\n수업 밖에서도 이어지는 케어.",
  },
  {
    key: "om",
    kicker: "요가톡",
    title: "요가톡,\n그리고 옴",
    desc: "선생님께 바로 질문하고\n옴에게 자세, 호흡, 시퀀스를 물어보세요.",
  },
];

// 역할 슬라이드에 노출되는 두 역할 설명
const ROLE_CARDS: { label: string; desc: string }[] = [
  {
    label: "수련생",
    desc: "수업 신청, 출석과 기록 관리, 선생님과 요가톡",
  },
  {
    label: "선생님",
    desc: "요가원, 클래스, 수련생, 수업권 관리 (원장)",
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    // 설정에서 미리보기로 진입(스택에 이전 화면 있음) → 뒤로가기.
    // 가입 직후 진입(스택 초기화됨) → 앱으로 이동.
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: "TabNavigator" }] });
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.skipRow}>
        <TouchableOpacity
          onPress={finish}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s) => (
          <View key={s.key} style={[styles.slide, { width }]}>
            <View style={styles.accentBar} />
            <Text style={styles.kicker}>{s.kicker}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.desc}>{s.desc}</Text>
            {s.roles ? (
              <View style={styles.roleCards}>
                {ROLE_CARDS.map((r) => (
                  <View key={r.label} style={styles.roleCard}>
                    <Text style={styles.roleCardLabel}>{r.label}</Text>
                    <Text style={styles.roleCardDesc}>{r.desc}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={isLast ? "시작하기" : "다음"}
          size="large"
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  skipRow: {
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
  },
  skipText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  slide: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  accentBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 26,
  },
  roleCards: {
    width: "100%",
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  roleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  roleCardLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  roleCardDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: SPACING.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: { backgroundColor: COLORS.primary, width: 22 },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
});
