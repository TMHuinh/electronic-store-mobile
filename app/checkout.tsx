import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { API_URL } from "../constants/api";
import { useAuth } from "../context/AuthContext";
import { CartItem, useCart } from "../context/CartContext";

export default function CheckoutScreen() {
  const { cart, clearCart } = useCart();
  const { token, user } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPrice = cart.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!user?._id) return Alert.alert("⚠️", "Vui lòng đăng nhập");
    if (!address.trim() || !phone.trim()) {
      return Alert.alert("⚠️", "Vui lòng nhập địa chỉ và số điện thoại");
    }
    if (cart.length === 0) {
      return Alert.alert("⚠️", "Giỏ hàng trống");
    }
    if (!token) return Alert.alert("⚠️", "Token không hợp lệ");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: user._id,
          items: cart.map((i) => ({ product: i._id, quantity: i.quantity })),
          address,
          phone,
          paymentMethod: "COD",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Server response:", data);
        throw new Error(data.message || "Đặt hàng thất bại");
      }

      Alert.alert("✅", "Đặt hàng thành công");
      await clearCart(); // clear cart trước khi chuyển
      router.replace("/orders"); // chuyển thẳng tới trang OrdersList
    } catch (err: any) {
      Alert.alert("❌", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
      <TextInput
        placeholder="Địa chỉ"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />
      <TextInput
        placeholder="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text style={styles.sectionTitle}>Sản phẩm</Text>
      <FlatList
        data={cart}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <Text>
              {item.quantity} x {item.price.toLocaleString()}₫
            </Text>
          </View>
        )}
      />

      <View style={styles.totalRow}>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Tổng:</Text>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
          {totalPrice.toLocaleString()}₫
        </Text>
      </View>

      <TouchableOpacity
        style={styles.orderBtn}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        <Text style={styles.orderText}>
          {loading ? "Đang xử lý..." : "Đặt hàng"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 15, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  orderBtn: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  orderText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
