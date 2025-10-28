import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { API_URL } from "../../constants/api";
import { Ionicons } from "@expo/vector-icons";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: { url: string }[];
  rating: number;
  numReviews: number;
  category?: string;
}

export default function ProductListScreen() {
  const { id } = useLocalSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ✅ Dùng useRef để tránh tạo Animated.Value mới mỗi lần render
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.ease,
      useNativeDriver: Platform.OS !== "web", // ✅ fix cảnh báo useNativeDriver
    }).start();
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${API_URL}/products`;
        if (pathname.startsWith("/category/")) url += `?category=${id}`;
        else if (pathname.startsWith("/brand/")) url += `?brand=${id}`;

        const res = await fetch(url);
        const data = await res.json();
        setAllProducts(data);
        setVisibleProducts(data.slice(0, 12));
      } catch (err) {
        console.error("❌ Lỗi tải sản phẩm:", err);
      } finally {
        setLoading(false);
        fadeIn();
      }
    };
    fetchProducts();
  }, [id, pathname]);

  const handleLoadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleProducts(allProducts.slice(0, visibleProducts.length + 8));
      setLoadingMore(false);
    }, 700);
  };

  const renderStars = (rating: number) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => {
        const icon =
          rating >= i
            ? "star"
            : rating >= i - 0.5
            ? "star-half"
            : "star-outline";
        return (
          <Ionicons key={i} name={icon as any} size={14} color="#f5c518" />
        );
      })}
    </View>
  );

  let title = "Tất cả sản phẩm";
  if (pathname.startsWith("/category/")) title = "🧩 Sản phẩm theo danh mục";
  if (pathname.startsWith("/brand/")) title = "🏷️ Sản phẩm theo thương hiệu";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={{ marginTop: 10, color: "#555" }}>
          Đang tải sản phẩm...
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>{title}</Text>

      {visibleProducts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={50} color="#aaa" />
          <Text style={{ color: "#777", marginTop: 10 }}>
            Không có sản phẩm nào.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleProducts}
          keyExtractor={(item) => item._id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/product/[id]",
                  params: { id: item._id },
                })
              }
            >
              <Image
                source={{
                  uri:
                    item.images?.[0]?.url ||
                    "https://res.cloudinary.com/dxjvlcd5s/image/upload/v1760331029/products/bqlaqfriqvzfnagwpoic.jpg",
                }}
                style={styles.image}
              />
              <View style={{ padding: 6 }}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.price}>
                  {item.price?.toLocaleString()}₫
                </Text>
                <View style={styles.ratingRow}>
                  {renderStars(item.rating || 0)}
                  <Text style={styles.reviewText}>
                    ({item.numReviews || 0})
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            visibleProducts.length < allProducts.length ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loadMoreText}>Tải thêm</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  listContent: {
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
    color: "#2ecc71",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    width: "48%",
    elevation: 3,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 6px rgba(0,0,0,0.1)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }),
  },
  image: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productName: {
    fontWeight: "600",
    color: "#333",
    fontSize: 13.5,
  },
  price: {
    color: "#27ae60",
    fontWeight: "700",
    marginTop: 4,
    fontSize: 14,
  },
  starRow: {
    flexDirection: "row",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  reviewText: {
    color: "#888",
    fontSize: 12,
    marginLeft: 4,
  },
  loadMoreBtn: {
    backgroundColor: "#27ae60",
    alignSelf: "center",
    marginTop: 12,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 30,
    elevation: 2,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 4px rgba(0,0,0,0.15)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 2 },
        }),
  },
  loadMoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
