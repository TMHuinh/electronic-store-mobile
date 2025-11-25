const isWeb = typeof window !== "undefined";

export const API_URL = isWeb
  ? "https://electronic-store-1.onrender.com/api"
  : "https://electronic-store-1.onrender.com/api"; 
