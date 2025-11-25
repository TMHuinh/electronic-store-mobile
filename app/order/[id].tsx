import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  shippingAddress?: string;
  customerName?: string;
  customerPhone?: string;
}

export default function OrderDetailScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể tải đơn hàng");

      // Nếu thiếu thông tin khách hàng, fetch profile từ /users/profile
      if (!data.customerName || !data.customerPhone) {
        if (token) {
          const profileRes = await fetch(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const profileData = await profileRes.json();
          data.customerName = profileData.name || "-";
          data.customerPhone = profileData.phone || "-";
          data.shippingAddress =
            data.shippingAddress || profileData.address || "-";
        }
      }

      setOrder(data);
    } catch (err) {
      console.log("Fetch order detail error:", err);
      Alert.alert("❌ Lỗi", "Không thể tải chi tiết đơn hàng");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      Alert.alert("❌", "Bạn cần đăng nhập để xem chi tiết đơn hàng");
      router.replace("/login");
      return;
    }
    fetchOrderDetail();
  }, [id, token]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 10, color: "#555" }}>
          Đang tải chi tiết đơn hàng...
        </Text>
      </View>
    );

  if (!order)
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777", fontSize: 16 }}>
          Không tìm thấy đơn hàng
        </Text>
      </View>
    );

  const renderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.productCard}>
      <Image
        source={{
          uri:
            item.image ||
            "https://res.cloudinary.com/dxjvlcd5s/image/upload/v1760331029/products/bqlaqfriqvzfnagwpoic.jpg",
        }}
        style={styles.productImage}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text numberOfLines={2} style={styles.productName}>
          {item.name}
        </Text>
        <Text style={styles.productQty}>Số lượng: {item.quantity}</Text>
      </View>
      <Text style={styles.productPrice}>
        {(item.quantity * item.price).toLocaleString()}₫
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={styles.header}>
        <Text style={styles.orderTitle}>Đơn hàng #{order._id.slice(-6)}</Text>
      </View>

      {/* Trạng thái */}
      <View
        style={[
          styles.statusCard,
          {
            borderLeftColor:
              order.status === "Processing" ? "#e67e22" : "#28a745",
          },
        ]}
      >
        <MaterialIcons
          name="info-outline"
          size={22}
          color={order.status === "Processing" ? "#e67e22" : "#28a745"}
        />
        <Text
          style={[
            styles.statusText,
            order.status === "Processing"
              ? styles.processing
              : styles.completed,
          ]}
        >
          {order.status}
        </Text>
      </View>

      {/* Thông tin khách hàng */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
        <View style={styles.infoRow}>
          <MaterialIcons name="person-outline" size={20} color="#555" />
          <Text style={styles.infoText}>{order.customerName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={20} color="#555" />
          <Text style={styles.infoText}>{order.customerPhone}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={20} color="#555" />
          <Text style={styles.infoText}>{order.shippingAddress}</Text>
        </View>
      </View>

      {/* Sản phẩm */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Sản phẩm</Text>
        <FlatList
          data={order.items}
          keyExtractor={(item) => item.productId}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      </View>

      {/* Tóm tắt đơn hàng */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tổng tiền:</Text>
          <Text style={styles.summaryValue}>
            {order.total.toLocaleString()}₫
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ngày đặt:</Text>
          <Text style={styles.summaryValue}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4", padding: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingVertical: 10, alignItems: "center" },
  orderTitle: { fontSize: 22, fontWeight: "700", color: "#28a745" },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 5,
    elevation: 2,
  },
  statusText: { marginLeft: 8, fontWeight: "700", fontSize: 16 },
  processing: { color: "#e67e22" },
  completed: { color: "#28a745" },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#555",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  infoText: { marginLeft: 6, fontWeight: "600", color: "#333" },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fefefe",
    marginBottom: 8,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  productName: { fontWeight: "600", fontSize: 15, color: "#333" },
  productQty: { fontSize: 14, color: "#555", marginTop: 4 },
  productPrice: { fontWeight: "700", color: "#28a745" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  summaryLabel: { fontWeight: "600", color: "#555" },
  summaryValue: { fontWeight: "700", color: "#28a745" },
});
