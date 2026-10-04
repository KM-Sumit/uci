import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/store/auth";
import { useColors } from "@/hooks/useColors";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.replace(/^Error:\s*/, "") : "Sign-in failed. Please try again.";
}

export default function SignInScreen() {
  const colors = useColors();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function submit() {
    if (!identifier.trim() || !password) {
      setError("Enter your email or mobile number and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signIn(identifier.trim(), password);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.content}>
        <View style={[styles.brandMark, { backgroundColor: colors.foreground }]}>
          <Ionicons name="book-outline" size={22} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.brand, { color: colors.foreground }]}>UCI<Text style={{ color: colors.primary }}>.</Text></Text>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>GOVERNMENT EXAM PREPARATION</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to continue your preparation.</Text>

        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email or mobile number</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={17} color={colors.mutedForeground} />
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              testID="login-identifier"
              returnKeyType="next"
            />
          </View>
        </View>
        <View style={styles.fieldWrap}>
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={17} color={colors.mutedForeground} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              testID="login-password"
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
            <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"} onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable onPress={() => void submit()} disabled={busy} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.65 : 1 }]} testID="login-submit">
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? "Signing in…" : "Sign in"}</Text>
          {!busy ? <Feather name="arrow-right" size={17} color={colors.primaryForeground} /> : null}
        </Pressable>
        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>New to UCI? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable><Text style={[styles.link, { color: colors.primary }]}>Create an account</Text></Pressable>
          </Link>
        </View>
        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>Your account and learning progress stay private.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  content: { width: "100%", maxWidth: 430, alignSelf: "center" },
  brandMark: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  brand: { fontSize: 22, fontWeight: "800", letterSpacing: 0.4 },
  eyebrow: { fontSize: 9, fontWeight: "800", letterSpacing: 1.1, marginTop: 4 },
  title: { fontSize: 31, lineHeight: 38, letterSpacing: -0.8, fontWeight: "800", marginTop: 28 },
  subtitle: { fontSize: 14, marginTop: 7, marginBottom: 25 },
  fieldWrap: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 7 },
  inputWrap: { height: 51, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, fontSize: 14, paddingVertical: 0 },
  error: { fontSize: 12, lineHeight: 18, marginVertical: 3 },
  button: { height: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 9 },
  buttonText: { fontSize: 14, fontWeight: "800" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 21 },
  link: { fontSize: 13, fontWeight: "800" },
  footnote: { textAlign: "center", fontSize: 11, marginTop: 26 },
});