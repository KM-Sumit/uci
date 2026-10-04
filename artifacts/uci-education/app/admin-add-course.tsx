import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { apiFetch } from "@/lib/apiFetch";

const EXAMS = ["SSC", "UPSC", "IBPS", "RRB", "Police", "State PSC", "Other"];

export default function AdminAddCourseScreen() {
  const colors = useColors();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [exam, setExam] = useState("SSC");
  const [category, setCategory] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setError("Course title is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim() || "UCI Faculty",
          exam,
          category: category.trim() || exam,
          thumbnailUrl: thumbnailUrl.trim(),
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create course.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.successBox}>
          <View style={[styles.successIcon, { backgroundColor: "#6366f120" }]}>
            <Feather name="book-open" size={40} color="#6366f1" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Course Added! 🎉</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            "{title}" has been published and is now visible to students.
          </Text>
          <Pressable onPress={() => { setSuccess(false); setTitle(""); setDescription(""); setInstructor(""); setThumbnailUrl(""); }} style={[styles.btn, { backgroundColor: colors.primary, marginBottom: 10 }]}>
            <Feather name="plus" size={15} color={colors.primaryForeground} />
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Add Another Course</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={[styles.btn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={15} color={colors.foreground} />
            <Text style={[styles.btnText, { color: colors.foreground }]}>Back to Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={16} color={colors.foreground} />
          <Text style={[styles.backText, { color: colors.foreground }]}>Admin Home</Text>
        </Pressable>

        <View style={[styles.headerIcon, { backgroundColor: "#6366f120" }]}>
          <Feather name="book-open" size={26} color="#6366f1" />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Course</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Create a new course that will be immediately visible to students.
        </Text>

        <Field label="Course Title *" value={title} onChangeText={setTitle} placeholder="e.g. Complete SSC GK Preparation" icon="book" colors={colors} />
        <Field label="Description" value={description} onChangeText={setDescription} placeholder="Brief course description..." icon="align-left" colors={colors} multiline />
        <Field label="Instructor Name" value={instructor} onChangeText={setInstructor} placeholder="UCI Faculty" icon="user" colors={colors} />
        <Field label="Thumbnail URL" value={thumbnailUrl} onChangeText={setThumbnailUrl} placeholder="https://..." icon="image" colors={colors} keyboardType="url" />

        <Text style={[styles.label, { color: colors.foreground }]}>Exam Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {EXAMS.map((e) => (
            <Pressable key={e} onPress={() => setExam(e)} style={[styles.chip, { backgroundColor: exam === e ? colors.primary : colors.card, borderColor: exam === e ? colors.primary : colors.border }]}>
              <Text style={[styles.chipText, { color: exam === e ? colors.primaryForeground : colors.foreground }]}>{e}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Field label="Category" value={category} onChangeText={setCategory} placeholder={exam} icon="tag" colors={colors} />

        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}

        <Pressable onPress={() => void submit()} disabled={busy} style={[styles.submitBtn, { backgroundColor: "#6366f1", opacity: busy ? 0.65 : 1 }]}>
          <Feather name={busy ? "loader" : "plus-circle"} size={17} color="#fff" />
          <Text style={styles.submitBtnText}>{busy ? "Creating…" : "Publish Course"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, icon, colors, multiline, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border, minHeight: multiline ? 80 : 48, alignItems: multiline ? "flex-start" : "center", paddingTop: multiline ? 12 : 0 }]}>
        <Feather name={icon} size={15} color={colors.mutedForeground} style={{ marginTop: multiline ? 2 : 0 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "url" ? "none" : "sentences"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 40 },
  back: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: "700" },
  headerIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  inputWrap: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, fontSize: 13, paddingVertical: 12 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },
  errorText: { fontSize: 12, lineHeight: 18, marginTop: 10 },
  submitBtn: { height: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 22 },
  submitBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  successBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 },
  successIcon: { width: 80, height: 80, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  successSub: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 30 },
  btn: { width: "100%", height: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { fontSize: 13, fontWeight: "700" },
});
