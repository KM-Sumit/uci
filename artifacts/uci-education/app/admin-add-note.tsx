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

const SUBJECTS = ["General Knowledge", "Mathematics", "Reasoning", "English", "History", "Geography", "Science", "Economics", "Polity"];
const EXAMS = ["SSC", "UPSC", "IBPS", "RRB", "Police", "State PSC", "Other"];

export default function AdminAddNoteScreen() {
  const colors = useColors();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("General Knowledge");
  const [exam, setExam] = useState("SSC");
  const [pdfUrl, setPdfUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setError("Note title is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiFetch("/api/admin/notes", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          body: body.trim(),
          subject,
          exam,
          pdfUrl: pdfUrl.trim(),
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create note.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.successBox}>
          <View style={[styles.successIcon, { backgroundColor: "#10b98120" }]}>
            <Feather name="file-text" size={40} color="#10b981" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Note Published! 🎉</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            "{title}" is now visible to all students in the Notes section.
          </Text>
          <Pressable onPress={() => { setSuccess(false); setTitle(""); setDescription(""); setBody(""); setPdfUrl(""); }} style={[styles.btn, { backgroundColor: colors.primary, marginBottom: 10 }]}>
            <Feather name="plus" size={15} color={colors.primaryForeground} />
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Add Another Note</Text>
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

        <View style={[styles.headerIcon, { backgroundColor: "#10b98120" }]}>
          <Feather name="file-text" size={26} color="#10b981" />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Study Note</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Create a note or study material that will be immediately available to students.
        </Text>

        {/* Title */}
        <Text style={[styles.label, { color: colors.foreground }]}>Note Title *</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="file-text" size={15} color={colors.mutedForeground} />
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Indian Rivers — Complete Notes" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} autoCapitalize="words" />
        </View>

        {/* Description */}
        <Text style={[styles.label, { color: colors.foreground }]}>Short Description</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border, minHeight: 70, alignItems: "flex-start", paddingTop: 12 }]}>
          <Feather name="align-left" size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <TextInput value={description} onChangeText={setDescription} placeholder="What this note covers..." placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} multiline autoCapitalize="sentences" />
        </View>

        {/* Body Content */}
        <Text style={[styles.label, { color: colors.foreground }]}>Note Content</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border, minHeight: 120, alignItems: "flex-start", paddingTop: 12 }]}>
          <Feather name="edit-3" size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <TextInput value={body} onChangeText={setBody} placeholder="Write the note content here (optional if PDF is provided)..." placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} multiline autoCapitalize="sentences" />
        </View>

        {/* PDF URL */}
        <Text style={[styles.label, { color: colors.foreground }]}>PDF URL (optional)</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="link" size={15} color={colors.mutedForeground} />
          <TextInput value={pdfUrl} onChangeText={setPdfUrl} placeholder="https://..." placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} keyboardType="url" autoCapitalize="none" />
        </View>

        {/* Subject */}
        <Text style={[styles.label, { color: colors.foreground }]}>Subject</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SUBJECTS.map((s) => (
            <Pressable key={s} onPress={() => setSubject(s)} style={[styles.chip, { backgroundColor: subject === s ? colors.primary : colors.card, borderColor: subject === s ? colors.primary : colors.border }]}>
              <Text style={[styles.chipText, { color: subject === s ? colors.primaryForeground : colors.foreground }]}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exam */}
        <Text style={[styles.label, { color: colors.foreground }]}>Exam</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {EXAMS.map((e) => (
            <Pressable key={e} onPress={() => setExam(e)} style={[styles.chip, { backgroundColor: exam === e ? colors.primary : colors.card, borderColor: exam === e ? colors.primary : colors.border }]}>
              <Text style={[styles.chipText, { color: exam === e ? colors.primaryForeground : colors.foreground }]}>{e}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}

        <Pressable onPress={() => void submit()} disabled={busy} style={[styles.submitBtn, { backgroundColor: "#10b981", opacity: busy ? 0.65 : 1 }]}>
          <Feather name={busy ? "loader" : "upload-cloud"} size={17} color="#fff" />
          <Text style={styles.submitBtnText}>{busy ? "Publishing…" : "Publish Note"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
