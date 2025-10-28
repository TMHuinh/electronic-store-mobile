import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_URL } from "../constants/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

interface DisplayCartItem {
  _id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface ServerCartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: { url: string }[];
  };
  quantity: number;
}

export default function CartScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { cart: localCart, clearCart: clearLocalCart } = useCart();
  const [serverCart, setServerCart] = useState<ServerCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 🧭 Lấy giỏ hàng server nếu có token
  const fetchCart = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/carts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setServerCart(data.items || []);
    } catch (err) {
      console.log("❌ Lỗi tải giỏ hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  // 🔁 Chuẩn hóa dữ liệu
  const cart: DisplayCartItem[] = token
    ? serverCart.map((i) => ({
        _id: i.product?._id,
        name: i.product?.name,
        price: i.product?.price,
        image: i.product?.images?.[0]?.url,
        quantity: i.quantity,
      }))
    : (localCart as DisplayCartItem[]);

  // ➕ / ➖ cập nhật số lượng
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!token) return;
    if (quantity < 1) return removeItem(productId);
    try {
      setUpdating(true);
      const res = await fetch(`${API_URL}/carts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      setServerCart(data.items);
    } catch (err) {
      console.log("❌ Lỗi cập nhật giỏ hàng:", err);
    } finally {
      setUpdating(false);
    }
  };

  // ❌ Xóa sản phẩm
  const removeItem = async (productId: string) => {
    if (!token) {
      Alert.alert("🗑️", "Xóa khỏi giỏ hàng cục bộ?", [
        { text: "Hủy" },
        { text: "Đồng ý", onPress: () => clearLocalCart() },
      ]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/carts/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setServerCart(data.items || []);
    } catch (err) {
      console.log("❌ Lỗi xóa sản phẩm:", err);
    }
  };

  // 🧹 Xóa toàn bộ
  const clearCart = async () => {
    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa toàn bộ sản phẩm?", [
      { text: "Hủy" },
      {
        text: "Đồng ý",
        style: "destructive",
        onPress: async () => {
          if (token) {
            try {
              await fetch(`${API_URL}/carts/clear`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              setServerCart([]);
            } catch (err) {
              console.log("❌ Lỗi clear giỏ hàng:", err);
            }
          } else {
            clearLocalCart();
          }
        },
      },
    ]);
  };

  // 💰 Tổng tiền
  const totalPrice = cart.reduce(
    (sum, i) => sum + (i.price || 0) * i.quantity,
    0
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 8, color: "#555" }}>
          Đang tải giỏ hàng...
        </Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>🛒 Giỏ hàng của bạn</Text>

        {cart.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="cart-outline" size={60} color="#aaa" />
            <Text style={{ color: "#777", marginTop: 10 }}>
              Giỏ hàng trống, hãy mua sắm ngay!
            </Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() => router.push("/products" as any)}
            >
              <Text style={styles.shopNowText}>🛍️ Tiếp tục mua hàng</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={cart}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 180 }}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <Image
                    source={{
                      uri:
                        item.image ||
                        "https://res.cloudinary.com/dxjvlcd5s/image/upload/v1760331029/products/bqlaqfriqvzfnagwpoic.jpg",
                    }}
                    style={styles.image}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.price}>
                      {item.price.toLocaleString()}₫ / sản phẩm
                    </Text>

                    {/* Số lượng + Tổng */}
                    <View style={styles.qtyRow}>
                      <Text style={styles.qtyLabel}>Số lượng:</Text>
                      {token ? (
                        <View style={styles.qtyActions}>
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item._id, item.quantity - 1)
                            }
                          >
                            <Ionicons
                              name="remove-circle-outline"
                              size={22}
                              color="#333"
                            />
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{item.quantity}</Text>
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item._id, item.quantity + 1)
                            }
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={22}
                              color="#28a745"
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                      )}
                    </View>

                    <Text style={styles.itemTotal}>
                      Tổng: {(item.price * item.quantity).toLocaleString()}₫
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeItem(item._id)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Xóa toàn bộ */}
            <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
              <Text style={styles.clearText}>🧹 Xóa toàn bộ giỏ hàng</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Footer thanh toán luôn cố định, không đè */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalPrice}>
              {totalPrice.toLocaleString()}₫
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, cart.length === 0 && { opacity: 0.5 }]}
            onPress={() => router.push("/checkout" as any)}
            disabled={cart.length === 0}
          >
            <Text style={styles.checkoutText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f8f8" },
  container: { flex: 1, padding: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#28a745",
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    elevation: 2,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 6px rgba(0,0,0,0.1)" }
      : {}),
  },
  image: { width: 70, height: 70, borderRadius: 8 },
  info: { flex: 1, marginHorizontal: 10 },
  name: { fontWeight: "600", color: "#333" },
  price: { color: "#28a745", fontWeight: "700", marginTop: 2 },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  qtyLabel: { color: "#555", fontSize: 13 },
  qtyActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyValue: { fontSize: 15, fontWeight: "600", marginHorizontal: 6 },
  itemTotal: {
    color: "#d32f2f",
    fontWeight: "600",
    marginTop: 4,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  totalLabel: { color: "#555", fontSize: 14 },
  totalPrice: { color: "#28a745", fontSize: 20, fontWeight: "700" },
  checkoutBtn: {
    backgroundColor: "#28a745",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 25,
  },
  checkoutText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  clearBtn: {
    alignSelf: "center",
    marginVertical: 10,
  },
  clearText: { color: "#888", fontSize: 13 },
  shopNowBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 14,
  },
  shopNowText: { color: "#fff", fontWeight: "bold" },
});
