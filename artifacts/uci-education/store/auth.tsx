import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  getCurrentUser,
  logIn as apiLogIn,
  logOut as apiLogOut,
  setAuthTokenGetter,
  signUp as apiSignUp,
} from "@workspace/api-client-react";
import type { User } from "@/types/content";
import { useRouter, useSegments } from "expo-router";

const TOKEN_KEY = "uci-access-token";
async function readToken() {
  if (Platform.OS === "web") {
    return typeof globalThis.sessionStorage === "undefined" ? null : globalThis.sessionStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function writeToken(token: string) {
  if (Platform.OS === "web") {
    if (typeof globalThis.sessionStorage !== "undefined") globalThis.sessionStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function removeToken() {
  if (Platform.OS === "web") {
    if (typeof globalThis.sessionStorage !== "undefined") globalThis.sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

setAuthTokenGetter(readToken);

interface SignUpInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  signIn(identifier: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const token = await readToken();
        if (token) {
          const response = await getCurrentUser();
          if (active) setUser(response.user);
        }
      } catch {
        await removeToken();
      } finally {
        if (active) setReady(true);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      async signIn(identifier, password) {
        const session = await apiLogIn({ identifier, password });
        await writeToken(session.token);
        setUser(session.user);
      },
      async signUp(input) {
        const session = await apiSignUp(input);
        await writeToken(session.token);
        setUser(session.user);
      },
      async signOut() {
        try {
          await apiLogOut();
        } finally {
          await removeToken();
          setUser(null);
        }
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

export function AuthRouteGate({ children }: React.PropsWithChildren) {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const isAuthScreen = segments[0] === "(auth)";
    if (!user && !isAuthScreen) router.replace("/(auth)/sign-in");
    else if (user && isAuthScreen) router.replace("/(tabs)/home");
  }, [ready, user, segments, router]);

  if (!ready) return null;
  return <>{children}</>;
}