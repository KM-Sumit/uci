import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/store/auth";

export default function IndexRoute() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return <Redirect href={user ? "/(tabs)/home" : "/(auth)/sign-in"} />;
}