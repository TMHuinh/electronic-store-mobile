import { useCart } from "@/context/CartContext";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../constants/api";
import { AuthContext } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useContext(AuthContext);
  const { refreshCart } = useCart(); // fetch cart server sau login

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // lưu token & user info vào AuthContext
        await signIn(data.token, data.user);

        // 🔹 Lấy giỏ hàng server ngay sau login
        await refreshCart();

        Alert.alert("✅ Đăng nhập thành công!");
        router.replace("/"); // chuyển về home
      } else {
        setError(data.message || "Sai thông tin đăng nhập");
      }
    } catch (err) {
      setError("⚠️ Lỗi kết nối server");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Mật khẩu"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Đăng nhập</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register" as any)}>
        <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#007bff", textAlign: "center", marginTop: 10, fontSize: 14 },
  error: { color: "red", marginBottom: 10, textAlign: "center" },
});
