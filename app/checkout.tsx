import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
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

interface UserInfo {
  name: string;
  phone: string;
  address: string;
}

export default function CheckoutScreen() {
  const { cart, clearCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    phone: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "MOMO" | "BANK">(
    "COD"
  );
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Fetch user profile từ API
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUserInfo({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      } catch (err) {
        console.log("Lỗi fetch profile:", err);
      } finally {
        setFetchingProfile(false);
      }
    };
    fetchProfile();
  }, [token]);

  const shippingFee = 20000;
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    if (!user?._id) return Alert.alert("⚠️", "Vui lòng đăng nhập");
    if (!userInfo.name || !userInfo.phone || !userInfo.address)
      return Alert.alert("⚠️", "Vui lòng nhập đầy đủ thông tin giao hàng");
    if (!cart.length) return Alert.alert("⚠️", "Giỏ hàng trống");
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
          address: `${userInfo.address} - ${userInfo.name} - ${userInfo.phone}`,
          paymentMethod,
          status: "Processing",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đặt hàng thất bại");

      Alert.alert("✅", "Đặt hàng thành công!");
      await clearCart();
      router.replace("/orders");
    } catch (err: any) {
      Alert.alert("❌", err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemCard}>
      <Image
        source={{ uri: item.image || "/no-image.png" }}
        style={styles.itemImage}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text>SL: {item.quantity}</Text>
        <Text style={{ fontWeight: "700", color: "#e74c3c" }}>
          {(item.price * item.quantity).toLocaleString()}₫
        </Text>
      </View>
    </View>
  );

  if (fetchingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Đang tải thông tin người dùng...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <Text style={styles.sectionTitle}>Đơn hàng của bạn</Text>
        <FlatList
          data={cart}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          scrollEnabled={false}
        />

        <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
        <TextInput
          placeholder="Họ và tên"
          style={styles.input}
          value={userInfo.name}
          onChangeText={(name) => setUserInfo({ ...userInfo, name })}
        />
        <TextInput
          placeholder="Số điện thoại"
          style={styles.input}
          keyboardType="phone-pad"
          value={userInfo.phone}
          onChangeText={(phone) => setUserInfo({ ...userInfo, phone })}
        />
        <TextInput
          placeholder="Địa chỉ"
          style={styles.input}
          value={userInfo.address}
          onChangeText={(address) => setUserInfo({ ...userInfo, address })}
        />

        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={paymentMethod}
            onValueChange={(val: "COD" | "MOMO" | "BANK") =>
              setPaymentMethod(val)
            }
          >
            <Picker.Item label="Thanh toán khi nhận hàng (COD)" value="COD" />
            <Picker.Item label="Ví Momo" value="MOMO" />
            <Picker.Item label="Chuyển khoản ngân hàng" value="BANK" />
          </Picker>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Tạm tính:</Text>
            <Text>{subtotal.toLocaleString()}₫</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Phí vận chuyển:</Text>
            <Text>{shippingFee.toLocaleString()}₫</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ fontWeight: "700" }}>Tổng cộng:</Text>
            <Text style={{ fontWeight: "700", color: "#e74c3c" }}>
              {total.toLocaleString()}₫
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.orderText}>
            {loading ? "Đang xử lý..." : "Đặt hàng"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  itemCard: {
    flexDirection: "row",
    padding: 12,
    marginHorizontal: 15,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  itemName: { fontWeight: "600", fontSize: 16 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  summary: {
    marginTop: 15,
    marginHorizontal: 15,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  orderBtn: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  orderText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
