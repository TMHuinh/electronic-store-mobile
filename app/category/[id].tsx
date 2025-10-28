import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../constants/api";

const { width } = Dimensions.get("window");

interface Product {
  _id: string;
  name: string;
  price: number;
  images: { url: string }[];
  rating: number;
  numReviews: number;
}

export default function CategoryPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const ITEM_WIDTH = (width - 30) / 2; // mỗi item chiếm nửa màn + margin

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products?category=${id}`);
        const data = await res.json();
        setProducts(data);
        setVisibleProducts(data.slice(0, 12));
      } catch (err) {
        console.error("❌ Lỗi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id]);

  const handleLoadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const nextItems = products.slice(0, visibleProducts.length + 8);
      setVisibleProducts(nextItems);
      setLoadingMore(false);
    }, 600);
  };

  const renderStars = (rating: number) => (
    <View style={{ flexDirection: "row" }}>
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

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 10, color: "#555" }}>
          Đang tải sản phẩm...
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧩 Sản phẩm theo danh mục</Text>

      {visibleProducts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={50} color="#aaa" />
          <Text style={{ color: "#777", marginTop: 8 }}>
            Không có sản phẩm nào.
          </Text>
        </View>
      ) : (
        <FlatList
          data={
            visibleProducts.length % 2 === 1
              ? [...visibleProducts, { _id: "empty" } as any]
              : visibleProducts
          } // thêm 1 item trống nếu lẻ
          keyExtractor={(item, index) => item._id + index}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 12,
          }}
          renderItem={({ item }) =>
            item._id === "empty" ? (
              <View style={{ width: ITEM_WIDTH, opacity: 0 }} />
            ) : (
              <TouchableOpacity
                style={[styles.card, { width: ITEM_WIDTH }]}
                activeOpacity={0.85}
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
                <View style={{ paddingVertical: 6 }}>
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
            )
          }
          ListFooterComponent={
            visibleProducts.length < products.length ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fafafa",
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
    color: "#28a745",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 3px 6px rgba(0,0,0,0.1)" }
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
    borderRadius: 10,
  },
  productName: {
    fontWeight: "600",
    color: "#333",
    fontSize: 13.5,
  },
  price: {
    color: "#28a745",
    fontWeight: "700",
    marginVertical: 4,
    fontSize: 14,
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
    backgroundColor: "#28a745",
    alignSelf: "center",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
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
