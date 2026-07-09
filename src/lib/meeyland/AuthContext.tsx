"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { API_BASE } from "@/lib/utils";

export interface AuthUser {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("meeyland_user");
      if (stored) {
        setUser(JSON.parse(stored) as AuthUser);
      }
    } catch { }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Login failed");
    }
    const data = await res.json();
    const authUser: AuthUser = {
      userId: data.userId,
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl,
      token: data.token,
    };
    setUser(authUser);
    localStorage.setItem("meeyland_user", JSON.stringify(authUser));
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "Registration failed");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("meeyland_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
