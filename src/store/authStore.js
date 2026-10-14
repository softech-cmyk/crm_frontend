import { create } from "zustand";
import { API_BASE, apiFetch } from "../api.js";

export const useAuthStore = create((set) => ({
  user: null,
  status: "loading", // "loading" | "authenticated" | "unauthenticated"

  fetchMe: async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/me`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ user: data.user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  login: async (email, password) => {
    const res = await apiFetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    set({ user: data.user, status: "authenticated" });
    return data.user;
  },

  signup: async (name, email, password) => {
    const res = await apiFetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Signup failed");
    set({ user: data.user, status: "authenticated" });
    return data.user;
  },

  logout: async () => {
    await apiFetch(`${API_BASE}/api/auth/logout`, { method: "POST" });
    set({ user: null, status: "unauthenticated" });
  },
}));
