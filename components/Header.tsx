import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../constants/api";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Header() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext);
  const { count } = useCart();
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // 🔍 Lấy danh mục
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/categories`);
        const data = await res.json();
        setCategories(data.slice(0, 6));
      } catch (e) {
        console.log("❌ Lỗi tải danh mục:", e);
      }
    })();
  }, []);

  // Gợi ý tìm kiếm
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (keyword.trim()) {
        try {
          const res = await fetch(`${API_URL}/products?keyword=${keyword}`);
          const data = await res.json();
          setSuggestions(data.slice(0, 5));
        } catch {
          setSuggestions([]);
        }
      } else setSuggestions([]);
    }, 300);
    return () => clearTimeout(delay);
  }, [keyword]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            placeholder="Tìm sản phẩm..."
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => {
              if (keyword.trim()) router.push(`/search/${keyword}` as any);
            }}
            style={styles.searchInput}
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword("")}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 🛒 Giỏ hàng */}
        <TouchableOpacity style={{marginEnd: 10}} onPress={() => router.push("/cart" as any)}>
          <View>
            <Feather name="shopping-cart" size={24} color="#333" />
            {count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.suggestionItem}
              onPress={() => {
                router.push(`/product/${item._id}` as any);
                setSuggestions([]);
                setKeyword("");
              }}
            >
              <Image
                source={{ uri: item.images?.[0]?.url }}
                style={styles.suggestionImage}
              />
              <Text numberOfLines={1} style={styles.suggestionText}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat._id}
            style={styles.categoryItem}
            onPress={() => router.push(`/category/${cat._id}` as any)}
          >
            <Text style={styles.categoryText}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingTop: 10,
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 7,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: 8,
  },
  searchInput: { flex: 1, height: 36, marginLeft: 6, fontSize: 14 },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  suggestionBox: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
    marginHorizontal: 10,
    padding: 6,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  suggestionImage: {
    width: 38,
    height: 38,
    borderRadius: 6,
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  categoryContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryItem: {
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  categoryText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 13,
  },
});
