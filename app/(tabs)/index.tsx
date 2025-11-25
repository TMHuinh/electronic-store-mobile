import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../components/Header";
import { API_URL } from "../../constants/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  images: { url: string }[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10); // số sản phẩm nổi bật đang hiển thị
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );

  const flashSale = products.slice(0, 5);
  const featured = products.slice(5, products.length);
  const visibleProducts = featured.slice(0, visibleCount);

  const handleLoadMore = () => {
    if (visibleCount < featured.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount((prev) => prev + 10);
        setLoadingMore(false);
      }, 600);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
          if (isCloseToBottom && !loadingMore && visibleCount < featured.length) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Flash Sale */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Flash Sale</Text>
            <TouchableOpacity onPress={() => router.push("/products" as any)}>
              <Text style={styles.link}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={flashSale}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.flashCard}
                onPress={() => router.push(`/product/${item._id}` as any)}
              >
                <Image
                  source={{ uri: item.images?.[0]?.url }}
                  style={styles.productImage}
                />
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>
                  {item.price.toLocaleString()}₫
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Sản phẩm nổi bật */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Sản phẩm nổi bật</Text>
          <View style={styles.grid}>
            {visibleProducts.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.gridItem}
                onPress={() => router.push(`/product/${item._id}` as any)}
              >
                <Image
                  source={{ uri: item.images?.[0]?.url }}
                  style={styles.gridImage}
                />
                <Text style={styles.gridName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.gridPrice}>
                  {item.price.toLocaleString()}₫
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nút tải thêm */}
          {visibleCount < featured.length && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loadMoreText}>Tải thêm</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: { marginTop: 16, paddingHorizontal: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  link: { color: "#4CAF50", fontWeight: "500" },
  flashCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginRight: 10,
    width: 150,
    padding: 8,
    elevation: 2,
  },
  productImage: { width: "100%", height: 120, borderRadius: 8 },
  productName: { fontWeight: "600", marginTop: 6, fontSize: 14 },
  productPrice: { color: "red", fontWeight: "bold", marginTop: 2 },
  grid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "48%",
    marginBottom: 12,
    padding: 10,
    elevation: 2,
  },
  gridImage: { width: "100%", height: 130, borderRadius: 8 },
  gridName: { fontSize: 14, fontWeight: "500", marginTop: 4 },
  gridPrice: { color: "#388E3C", fontWeight: "bold", marginTop: 2 },
  loadMoreButton: {
    marginTop: 8,
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  loadMoreText: { color: "#fff", fontWeight: "600" },
});
