import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AsanaCard } from "../components/AsanaCard";
import { COLORS } from "../constants/Colors";
import { useAuth } from "../hooks/useAuth";
import { Asana, asanasAPI } from "../lib/api/asanas";
import { RootStackParamList } from "../navigation/types";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 48 - 16) / 2; // 48 = 좌우 패딩, 16 = 카드 간 간격

export default function AsanasScreen() {
  const { isAuthenticated, loading } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [asanas, setAsanas] = useState<Asana[]>([]);
  const [loadingAsanas, setLoadingAsanas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 확인 및 보호
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigation.navigate("Auth");
    }
  }, [isAuthenticated, loading, navigation]);

  // 아사나 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadAsanas();
    }
  }, [isAuthenticated]);

  const loadAsanas = async () => {
    try {
      setLoadingAsanas(true);
      setError(null);

      const result = await asanasAPI.getAllAsanas();

      if (result.success && result.data) {
        setAsanas(result.data);
        console.log("아사나 데이터 로드 완료:", result.data.length, "개");
      } else {
        setError(result.message || "아사나 데이터를 불러오는데 실패했습니다.");
        console.error("아사나 데이터 로드 실패:", result.message);
      }
    } catch (error) {
      setError("아사나 데이터를 불러오는 중 오류가 발생했습니다.");
      console.error("아사나 데이터 로드 예외:", error);
    } finally {
      setLoadingAsanas(false);
    }
  };

  const handleAsanaPress = (asana: Asana) => {
    // 상세 화면으로 이동
    navigation.navigate("AsanaDetail", { id: asana.id });
  };

  const renderAsanaCard = ({ item }: { item: Asana }) => (
    <View style={styles.cardContainer}>
      <AsanaCard asana={item} onPress={handleAsanaPress} />
    </View>
  );

  // 로딩 중이거나 인증되지 않은 경우 빈 화면 표시
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>아사나</Text>

        {loadingAsanas ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              아사나 데이터를 불러오는 중...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : asanas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아사나 데이터가 없습니다.</Text>
          </View>
        ) : (
          <FlatList
            data={asanas}
            renderItem={renderAsanaCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
            alwaysBounceVertical={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={() => <View style={styles.footer} />}
          />
        )}
      </View>
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
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  listContainer: {
    paddingBottom: 24,
  },
  row: {
    justifyContent: "space-between",
  },
  cardContainer: {
    width: cardWidth,
  },
  separator: {
    height: 16,
  },
  footer: {
    height: 24,
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
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
