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
}

export default function OrdersListScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setOrders([]); 
        setLoading(false); 
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/orders/myorders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          console.log("Fetch orders error:", data);
          Alert.alert("❌ Lỗi fetch đơn hàng", data.message || "Lỗi server");
          setOrders([]);
        } else {
          setOrders(data);
        }
      } catch (err) {
        console.log("Fetch orders error:", err);
        Alert.alert("❌ Lỗi fetch đơn hàng", "Không thể kết nối server");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{ marginTop: 8, color: "#555" }}>
          Đang tải đơn hàng...
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777", fontSize: 25 }}>Bạn chưa có đơn hàng nào</Text>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/order/${item._id}` as any)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Đơn #{item._id.slice(-6)}</Text>
        <Text
          style={[
            styles.status,
            item.status === "Processing" ? styles.processing : styles.completed,
          ]}
        >
          {item.status}
        </Text>
      </View>

      {item.items.slice(0, 2).map((i) => (
        <View key={i.productId} style={styles.itemRow}>
          <Image
            source={{ uri: i.image || "/no-image.png" }}
            style={styles.image}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text numberOfLines={1} style={styles.itemName}>
              {i.name}
            </Text>
            <Text style={styles.itemQty}>
              {i.quantity} x {i.price.toLocaleString()}₫
            </Text>
          </View>
        </View>
      ))}

      {item.items.length > 2 && (
        <Text style={styles.moreText}>
          + {item.items.length - 2} sản phẩm khác
        </Text>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.total}>Tổng: {item.total.toLocaleString()}₫</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      renderItem={renderOrder}
      contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderId: { fontWeight: "700", color: "#333" },
  status: { fontWeight: "600" },
  processing: { color: "#e67e22" },
  completed: { color: "#28a745" },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  image: { width: 50, height: 50, borderRadius: 6, backgroundColor: "#eee" },
  itemName: { fontWeight: "600", color: "#333" },
  itemQty: { color: "#555", marginTop: 2 },
  moreText: { color: "#777", fontSize: 12, marginBottom: 4 },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  total: { fontWeight: "700", color: "#28a745" },
  date: { color: "#555", fontSize: 12 },
});
