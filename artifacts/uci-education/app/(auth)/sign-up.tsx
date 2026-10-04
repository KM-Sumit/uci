import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/store/auth";
import { useColors } from "@/hooks/useColors";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.replace(/^Error:\s*/, "") : "Account creation failed. Please try again.";
}

export default function SignUpScreen() {
  const colors = useColors();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim() || !email.trim() || !mobile.trim() || !password) {
      setError("Fill in all fields to create your account.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signUp({ name: name.trim(), email: email.trim().toLowerCase(), mobile: mobile.trim(), password });
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
        <Text style={[styles.brand, { color: colors.foreground }]}>Join UCI<Text style={{ color: colors.primary }}>.</Text></Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create an account to save lessons and test results.</Text>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" icon="user" colors={colors} testID="signup-name" />
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" icon="mail" colors={colors} testID="signup-email" keyboardType="email-address" />
        <Field label="Mobile number" value={mobile} onChangeText={setMobile} placeholder="+91 98765 43210" icon="phone" colors={colors} testID="signup-mobile" keyboardType="phone-pad" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" icon="lock" colors={colors} testID="signup-password" secureTextEntry />
        <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" icon="check" colors={colors} testID="signup-confirm-password" secureTextEntry />
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable onPress={() => void submit()} disabled={busy} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.65 : 1 }]} testID="signup-submit">
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? "Creating account…" : "Create account"}</Text>
          {!busy ? <Feather name="arrow-right" size={17} color={colors.primaryForeground} /> : null}
        </Pressable>
        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild><Pressable><Text style={[styles.link, { color: colors.primary }]}>Sign in</Text></Pressable></Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, icon, colors, testID, keyboardType, secureTextEntry }: any) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name={icon} size={16} color={colors.mutedForeground} />
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} autoCapitalize={keyboardType === "email-address" ? "none" : "words"} keyboardType={keyboardType} secureTextEntry={secureTextEntry} testID={testID} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 30 },
  content: { width: "100%", maxWidth: 430, alignSelf: "center" },
  brandMark: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 13 },
  brand: { fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 21 },
  fieldWrap: { marginBottom: 11 },
  label: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  inputWrap: { height: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, fontSize: 13, paddingVertical: 0 },
  error: { fontSize: 12, lineHeight: 18, marginVertical: 3 },
  button: { height: 49, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 7 },
  buttonText: { fontSize: 14, fontWeight: "800" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 18 },
  link: { fontSize: 13, fontWeight: "800" },
});