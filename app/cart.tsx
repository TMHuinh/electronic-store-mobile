import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

  const cart: DisplayCartItem[] = token
    ? serverCart.map((i) => ({
        _id: i.product?._id,
        name: i.product?.name,
        price: i.product?.price,
        image: i.product?.images?.[0]?.url,
        quantity: i.quantity,
      }))
    : (localCart as DisplayCartItem[]);

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

  const removeItem = async (productId: string) => {
    if (!token) {
      Alert.alert("Xóa giỏ hàng", "Xóa khỏi giỏ hàng cục bộ?", [
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

  const clearCart = async () => {
    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa toàn bộ?", [
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

  const totalPrice = cart.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
      </View>
    );

  const CartItem = ({ item }: { item: DisplayCartItem }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image || "https://res.cloudinary.com/dxjvlcd5s/image/upload/v1760331029/products/bqlaqfriqvzfnagwpoic.jpg" }}
        style={styles.cardImage}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardPrice}>{item.price.toLocaleString()}₫</Text>

        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity - 1)}>
            <Ionicons name="remove-circle" size={28} color="#555" />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item._id, item.quantity + 1)}>
            <Ionicons name="add-circle" size={28} color="#28a745" />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemTotal}>Tổng: {(item.price * item.quantity).toLocaleString()}₫</Text>
      </View>

      <TouchableOpacity onPress={() => removeItem(item._id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={24} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  const EmptyCart = () => (
    <View style={styles.center}>
      <Ionicons name="cart-outline" size={60} color="#aaa" />
      <Text style={styles.emptyText}>Giỏ hàng trống, hãy mua sắm ngay!</Text>
      <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push("/products" as any)}>
        <Text style={styles.shopNowText}>🛍️ Tiếp tục mua hàng</Text>
      </TouchableOpacity>
    </View>
  );

  const FooterCart = () => (
    <View style={styles.footer}>
      <View>
        <Text style={styles.totalLabel}>Tổng cộng</Text>
        <Text style={styles.totalPrice}>{totalPrice.toLocaleString()}₫</Text>
      </View>
      <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push("/checkout" as any)}>
        <Text style={styles.checkoutText}>Thanh toán</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.safe}>
      <Text style={styles.title}>🛒 Giỏ hàng của bạn</Text>
      {cart.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <CartItem item={item} />}
            contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 12 }}
          />
          <FooterCart />
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearText}>🧹 Xóa toàn bộ giỏ hàng</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f6f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { color: "#555", marginTop: 8 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginVertical: 12, color: "#28a745" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: { width: 80, height: 80, borderRadius: 12 },
  cardInfo: { flex: 1, marginHorizontal: 12 },
  cardName: { fontWeight: "600", fontSize: 16, color: "#333" },
  cardPrice: { fontWeight: "700", fontSize: 15, color: "#28a745", marginVertical: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  qtyValue: { fontSize: 16, fontWeight: "600" },
  itemTotal: { color: "#d32f2f", fontWeight: "700", marginTop: 6 },
  deleteBtn: { padding: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  totalLabel: { color: "#555", fontSize: 14 },
  totalPrice: { color: "#28a745", fontSize: 20, fontWeight: "700" },
  checkoutBtn: { backgroundColor: "#28a745", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  checkoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  clearBtn: { alignSelf: "center", marginVertical: 10 },
  clearText: { color: "#888", fontSize: 13 },
  emptyText: { color: "#777", marginTop: 10, textAlign: "center" },
  shopNowBtn: { backgroundColor: "#28a745", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 25, marginTop: 14 },
  shopNowText: { color: "#fff", fontWeight: "bold" },
});
