import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const [redirectLogin, setRedirectLogin] = useState(false);

  // Nếu user null -> redirect về login
  useEffect(() => {
    if (!user || redirectLogin) {
      router.replace("/login");
    }
  }, [user, redirectLogin]);

  const handleSignOut = () => {
    if (Platform.OS === "web") {
      const confirm = window.confirm("Bạn có chắc muốn đăng xuất?");
      if (!confirm) return;
    } else {
      Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: () => {
            setRedirectLogin(true); // trigger redirect
          },
        },
      ]);
      return; // dừng luồng, chờ user bấm
    }

    // mobile và web đều đi tới đây nếu confirm
    setLoading(true);
    signOut()
      .then(() => setRedirectLogin(true))
      .catch(() => {
        if (Platform.OS === "web") window.alert("Không thể đăng xuất");
        else Alert.alert("Lỗi", "Không thể đăng xuất");
      })
      .finally(() => setLoading(false));
  };

  if (!user || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3c2c84ff" />
      </View>
    );
  }

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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
