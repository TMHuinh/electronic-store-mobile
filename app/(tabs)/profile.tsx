import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.replace("/login"); // ✅ Quay về login nếu chưa đăng nhập
    return null;
  }

  const handleSignOut = async () => {
    let confirm = true;

    if (Platform.OS === "web") {
      confirm = window.confirm("Bạn có chắc muốn đăng xuất?");
    } else {
      Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
        { text: "Hủy", style: "cancel", onPress: () => (confirm = false) },
        { text: "Đồng ý", onPress: () => (confirm = true) },
      ]);
    }

    if (!confirm) return;

    setLoading(true);
    try {
      await signOut();
      router.replace("/login"); // về trang login
    } catch {
      if (Platform.OS === "web") {
        window.alert("Không thể đăng xuất");
      } else {
        Alert.alert("Lỗi", "Không thể đăng xuất");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin người dùng</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Tên:</Text>
        <Text style={styles.value}>{user.name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>
      <TouchableOpacity
        style={[styles.signOutBtn, loading && { opacity: 0.7 }]}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signOutText}>Đăng xuất</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  label: { fontWeight: "600", fontSize: 16, color: "#555" },
  value: { fontSize: 16 },
  signOutBtn: {
    marginTop: 30,
    backgroundColor: "#e74c3c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
