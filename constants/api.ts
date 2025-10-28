const isWeb = typeof window !== "undefined";

export const API_URL = isWeb
  ? "http://localhost:5000/api"
  : "http://10.0.2.2:5000/api"; 
