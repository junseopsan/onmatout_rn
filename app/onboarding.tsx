import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
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
  emoji?: string;
  image?: any;
  title: string;
  desc: string;
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    emoji: "🧘",
    title: "요가를 일상으로,\n온매아웃",
    desc: "수련 기록부터 선생님과의 연결까지\n요가 생활을 한 곳에서 이어가세요.",
  },
  {
    key: "care",
    emoji: "🤝",
    title: "선생님과 함께",
    desc: "출석 체크, 수업권, 복습 시퀀스까지\n수업 밖에서도 이어지는 케어.",
  },
  {
    key: "om",
    image: require("../assets/images/om_icon.png"),
    title: "요가톡, 그리고 옴",
    desc: "선생님께 바로 질문하고\n옴에게 자세·호흡·시퀀스를 물어보세요.",
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
            <View style={styles.iconCircle}>
              {s.image ? (
                <Image source={s.image} style={styles.iconImage} />
              ) : (
                <Text style={styles.emoji}>{s.emoji}</Text>
              )}
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.desc}>{s.desc}</Text>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  iconImage: { width: 72, height: 72, resizeMode: "contain", tintColor: COLORS.primary },
  emoji: { fontSize: 60 },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 32,
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
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
