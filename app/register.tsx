import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { API_URL } from "../constants/api";

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleRegister = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("✅ Đăng ký thành công!", "Kiểm tra email để xác thực.");
        router.replace("/(tabs)/login" as any);
      } else {
        Alert.alert("❌ Lỗi", data.message || "Không thể đăng ký.");
      }
    } catch {
      Alert.alert("⚠️ Lỗi kết nối server");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Đăng ký tài khoản
      </Text>

      <TextInput
        placeholder="Tên người dùng"
        value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(v) => setForm({ ...form, email: v })}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Mật khẩu"
        value={form.password}
        secureTextEntry
        onChangeText={(v) => setForm({ ...form, password: v })}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 20 }}
      />

      <Button title="Đăng ký" onPress={handleRegister} />
    </View>
  );
}
