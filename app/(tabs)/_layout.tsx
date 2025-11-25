import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  const activeColor = "#920c0cff";
  const inactiveColor = "#999";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 62,
          paddingBottom: 10,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? activeColor : inactiveColor, fontSize: 12 }}>
              Trang chủ
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="pricetag-outline"
              size={size}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? activeColor : inactiveColor, fontSize: 12 }}>
              Sản phẩm
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="receipt-outline"
              size={size}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? activeColor : inactiveColor, fontSize: 12 }}>
              Đơn hàng
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={focused ? activeColor : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ color: focused ? activeColor : inactiveColor, fontSize: 12 }}>
              Tài khoản
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
