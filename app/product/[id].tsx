import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  images: { url: string }[];
  rating: number;
  numReviews: number;
  stock?: number;
  category?: string | { _id: string; name: string };
}

interface Review {
  _id: string;
  user?: { _id: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);
  const router = useRouter();

  // Lấy chi tiết sản phẩm, reviews, liên quan
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        const data = await res.json();
        setProduct(data);

        const resReviews = await fetch(`${API_URL}/reviews/product/${id}`);
        const revData: Review[] = await resReviews.json();
        setReviews(revData);

        // Kiểm tra xem user có thể review không (đã mua & chưa review)
        if (token) {
          const check = await fetch(`${API_URL}/reviews/can-review/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await check.json();
          const userId = JSON.parse(atob(token.split(".")[1])).id;
          const userAlreadyReviewed = revData.some(
            (r) => r.user?._id === userId
          );
          setCanReview(result.canReview && !userAlreadyReviewed);
        }

        // Sản phẩm liên quan
        if (data.category?._id || data.category) {
          const categoryId =
            typeof data.category === "object"
              ? data.category._id
              : data.category;
          const resRelated = await fetch(
            `${API_URL}/products?category=${categoryId}`
          );
          const relatedData = await resRelated.json();
          setRelated(relatedData.filter((p: any) => p._id !== data._id));
        }
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err);
        Alert.alert("❌ Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const renderStars = (rating: number, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const icon =
        rating >= i ? "star" : rating >= i - 0.5 ? "star-half" : "star-outline";
      stars.push(
        <Ionicons key={i} name={icon as any} size={size} color="#f5c518" />
      );
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (!token) {
      Alert.alert("⚠️", "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      router.push("/login");
      return;
    }
    try {
      await addToCart({ productId: product._id, quantity });
      Alert.alert("✅", "Đã thêm sản phẩm vào giỏ hàng!");
    } catch {
      Alert.alert("⚠️", "Không thể thêm vào giỏ hàng!");
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/cart" as any);
  };

  if (loading || !product)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {/* Ảnh sản phẩm */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 10 }}
      >
        {product.images?.map((img, i) => (
          <Image key={i} source={{ uri: img.url }} style={styles.image} />
        ))}
      </ScrollView>

      {/* Thông tin sản phẩm */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.ratingRow}>
          {renderStars(product.rating || 0)}
          <Text style={styles.reviewText}>
            ({product.numReviews || 0} đánh giá)
          </Text>
        </View>
        <Text style={styles.price}>{product.price.toLocaleString()}₫</Text>

        {/* Số lượng */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.qtyText}>-</Text>
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 10, fontSize: 16 }}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() =>
              setQuantity((q) =>
                product.stock ? Math.min(product.stock, q + 1) : q + 1
              )
            }
          >
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Button */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, { borderColor: "#28a745" }]}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={20} color="#28a745" />
            <Text style={[styles.btnText, { color: "#28a745" }]}>
              Thêm vào giỏ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#dc3545" }]}
            onPress={handleBuyNow}
          >
            <Text style={[styles.btnText, { color: "#fff" }]}>Mua ngay</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
        <Text style={styles.desc}>
          {product.description || "Không có mô tả."}
        </Text>
      </View>

      {/* Review */}
      <View style={styles.reviewContainer}>
        <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
        {reviews.length === 0 ? (
          <Text style={{ color: "#666" }}>Chưa có đánh giá nào.</Text>
        ) : (
          <>
            {reviews.slice(0, visibleCount).map((r) => (
              <View key={r._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>
                    {r.user?.name || "Ẩn danh"}
                  </Text>
                  {renderStars(r.rating, 14)}
                </View>
                <Text style={styles.reviewComment}>{r.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            ))}
            {reviews.length > visibleCount && (
              <TouchableOpacity
                onPress={() => setVisibleCount((v) => v + 5)}
                style={styles.loadMoreReviewBtn}
              >
                <Text style={styles.loadMoreText}>
                  Xem thêm ({reviews.length - visibleCount})
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Form đánh giá */}
        {canReview && (
          <View style={styles.reviewForm}>
            <Text style={styles.formTitle}>Viết đánh giá của bạn</Text>
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                  <Ionicons
                    name={i <= rating ? "star" : "star-outline"}
                    size={22}
                    color="#f5c518"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Nhập nhận xét của bạn..."
              value={comment}
              onChangeText={setComment}
              multiline
              style={styles.reviewInput}
            />
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={async () => {
                if (!comment.trim()) {
                  Alert.alert("⚠️", "Vui lòng nhập nội dung đánh giá!");
                  return;
                }
                try {
                  const res = await fetch(`${API_URL}/reviews/product/${id}`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ rating, comment }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message);

                  // Thêm review mới
                  setReviews((prev) => [data.review, ...prev]);
                  setComment("");
                  setRating(0);
                  setCanReview(false); // Ẩn form sau khi review
                  Alert.alert("✅", "Đánh giá thành công!");
                } catch (err: any) {
                  Alert.alert("❌", err.message);
                }
              }}
            >
              <Text style={styles.submitText}>Gửi đánh giá</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sản phẩm liên quan */}
      {related.length > 0 && (
        <View style={{ marginTop: 20, paddingHorizontal: 15 }}>
          <Text style={styles.sectionTitle}>Sản phẩm tương tự</Text>
          <FlatList
            data={related.slice(0, 6)}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.relatedCard}
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
                  style={styles.relatedImage}
                />
                <Text style={styles.relatedName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.relatedPrice}>
                  {item.price.toLocaleString()}₫
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

// Styles giữ nguyên như cũ
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  image: { width: 400, height: 280, borderRadius: 10, marginRight: 10 },
  infoContainer: { padding: 15 },
  name: { fontSize: 22, fontWeight: "700", color: "#222", marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  reviewText: { color: "#888", marginLeft: 6, fontSize: 13 },
  price: { fontSize: 22, color: "#d32f2f", fontWeight: "700", marginBottom: 8 },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  btnText: { fontSize: 15, fontWeight: "600" },
  desc: { color: "#555", lineHeight: 22, fontSize: 14 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginVertical: 10,
  },
  relatedCard: {
    width: 150,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    elevation: 2,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 6px rgba(0,0,0,0.1)" }
      : {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }),
  },
  relatedImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 5,
  },
  relatedName: { fontWeight: "600", fontSize: 14, color: "#333" },
  relatedPrice: { color: "#28a745", fontWeight: "bold", marginVertical: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  reviewContainer: { paddingHorizontal: 15, marginTop: 20 },
  reviewCard: {
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between" },
  reviewUser: { fontWeight: "600", color: "#333" },
  reviewComment: { color: "#555", marginTop: 4 },
  reviewDate: { color: "#999", fontSize: 12, marginTop: 4 },
  loadMoreReviewBtn: {
    alignSelf: "center",
    padding: 8,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: "#e9ecef",
  },
  loadMoreText: { color: "#007bff", fontWeight: "600" },
  reviewForm: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  formTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    color: "#333",
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    minHeight: 70,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#28a745",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold" },
  qtyBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  qtyText: { fontSize: 18, fontWeight: "600" },
});
