import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CATEGORIES } from "../../constants/categories";
import { COLORS } from "../../constants/Colors";
import { Asana, asanasAPI } from "../../lib/api/asanas";
import { RootStackParamList } from "../../navigation/types";

const { width: screenWidth } = Dimensions.get("window");
const imageHeight = screenWidth * 0.75; // 화면 너비의 75% 높이

type AsanaDetailRouteProp = RouteProp<RootStackParamList, "AsanaDetail">;

export default function AsanaDetailScreen() {
  const route = useRoute<AsanaDetailRouteProp>();
  const navigation = useNavigation();
  const { id } = route.params;
  const [asana, setAsana] = useState<Asana | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAsanaDetail();
    }
  }, [id]);

  const loadAsanaDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // 모든 아사나를 가져와서 해당 ID의 아사나 찾기
      const result = await asanasAPI.getAllAsanas();

      if (result.success && result.data) {
        const foundAsana = result.data.find((a) => a.id === id);
        if (foundAsana) {
          console.log("아사나 상세 데이터:", {
            id: foundAsana.id,
            name: foundAsana.sanskrit_name_kr,
            category: foundAsana.category_name_en,
            level: foundAsana.level,
          });
          setAsana(foundAsana);
          console.log(
            "아사나 상세 데이터 로드 완료:",
            foundAsana.sanskrit_name_kr
          );
        } else {
          setError("아사나를 찾을 수 없습니다.");
        }
      } else {
        setError(result.message || "아사나 데이터를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      setError("아사나 데이터를 불러오는 중 오류가 발생했습니다.");
      console.error("아사나 상세 로드 예외:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "1":
        return COLORS.success;
      case "2":
        return COLORS.warning;
      case "3":
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case "1":
        return "초급";
      case "2":
        return "중급";
      case "3":
        return "고급";
      default:
        return "미정";
    }
  };

  const getCategoryLabel = (categoryNameEn: string) => {
    // categories.ts의 CATEGORIES에서 매칭되는 카테고리 찾기
    const category = CATEGORIES[categoryNameEn as keyof typeof CATEGORIES];

    console.log("카테고리 디버깅:", {
      original: categoryNameEn,
      found: category?.label || categoryNameEn,
    });

    return category?.label || categoryNameEn;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>아사나 정보를 불러오는 중...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !asana) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error || "아사나를 찾을 수 없습니다."}
            </Text>
            <TouchableOpacity
              style={styles.errorBackButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.errorBackButtonText}>뒤로 가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 이미지 영역 */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageNumber}>{asana.image_number}</Text>
            <Text style={styles.imagePlaceholderText}>이미지 준비 중</Text>
          </View>
        </View>

        {/* 내용 영역 */}
        <View style={styles.content}>
          {/* 제목 */}
          <Text style={styles.title}>{asana.sanskrit_name_kr}</Text>
          <Text style={styles.subtitle}>{asana.sanskrit_name_en}</Text>

          {/* 레벨 */}
          <View style={styles.levelContainer}>
            <Text style={styles.sectionTitle}>난이도</Text>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: getLevelColor(asana.level) },
              ]}
            >
              <Text style={styles.levelText}>{getLevelText(asana.level)}</Text>
            </View>
          </View>

          {/* 카테고리 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>카테고리</Text>
            <Text style={styles.sectionContent}>
              {asana.category_name_en &&
              asana.category_name_en !== "nan" &&
              asana.category_name_en !== "" &&
              asana.category_name_en !== null
                ? getCategoryLabel(asana.category_name_en)
                : "카테고리 정보 없음"}
            </Text>
          </View>

          {/* 의미 */}
          {asana.asana_meaning && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>의미</Text>
              <Text style={styles.sectionContent}>{asana.asana_meaning}</Text>
            </View>
          )}

          {/* 효과 */}
          {asana.effect && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>효과</Text>
              <Text style={styles.sectionContent}>{asana.effect}</Text>
            </View>
          )}

          {/* 하단 여백 */}
          <View style={styles.footer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40, // Adjust as needed for spacing
  },
  imageContainer: {
    width: screenWidth,
    height: imageHeight,
    backgroundColor: COLORS.surfaceDark,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceDark,
  },
  imageNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginBottom: 24,
  },
  levelContainer: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 24,
  },
  footer: {
    height: 40,
  },
  errorBackButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorBackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
