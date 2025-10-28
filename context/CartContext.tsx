// context/CartContext.tsx
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { API_URL } from "../constants/api";
import { useAuth } from "./AuthContext";

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  updating: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (item: { productId: string; quantity?: number }) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 🔹 Lấy giỏ hàng server
  const refreshCart = async () => {
    if (!token) {
      setCart([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/carts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const normalized: CartItem[] = (data.items || []).map((i: any) => ({
        _id: i.product._id,
        name: i.product.name,
        price: i.product.price,
        image: i.product.images?.[0]?.url,
        quantity: i.quantity,
      }));
      setCart(normalized);
    } catch (err) {
      console.log("❌ Lỗi load cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [token]);

  // ➕ Thêm sản phẩm vào cart
  const addToCart = async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
    if (!token) return;
    try {
      setUpdating(true);
      const res = await fetch(`${API_URL}/carts`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      const normalized: CartItem[] = (data.items || []).map((i: any) => ({
        _id: i.product._id,
        name: i.product.name,
        price: i.product.price,
        image: i.product.images?.[0]?.url,
        quantity: i.quantity,
      }));
      setCart(normalized);
    } catch (err) {
      console.log("❌ Lỗi thêm vào cart:", err);
    } finally {
      setUpdating(false);
    }
  };

  // ♻️ Cập nhật số lượng
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!token) return;
    try {
      setUpdating(true);
      const res = await fetch(`${API_URL}/carts`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await res.json();
      const normalized: CartItem[] = (data.items || []).map((i: any) => ({
        _id: i.product._id,
        name: i.product.name,
        price: i.product.price,
        image: i.product.images?.[0]?.url,
        quantity: i.quantity,
      }));
      setCart(normalized);
    } catch (err) {
      console.log("❌ Lỗi cập nhật cart:", err);
    } finally {
      setUpdating(false);
    }
  };

  // ❌ Xóa sản phẩm
  const removeFromCart = async (productId: string) => {
    if (!token) return;
    try {
      setUpdating(true);
      const res = await fetch(`${API_URL}/carts/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const normalized: CartItem[] = (data.items || []).map((i: any) => ({
        _id: i.product._id,
        name: i.product.name,
        price: i.product.price,
        image: i.product.images?.[0]?.url,
        quantity: i.quantity,
      }));
      setCart(normalized);
    } catch (err) {
      console.log("❌ Lỗi xóa cart:", err);
    } finally {
      setUpdating(false);
    }
  };

  // 🧹 Xóa toàn bộ
  const clearCart = async () => {
    if (!token) return;
    try {
      setUpdating(true);
      await fetch(`${API_URL}/carts/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart([]);
    } catch (err) {
      console.log("❌ Lỗi clear cart:", err);
    } finally {
      setUpdating(false);
    }
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, loading, updating, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
