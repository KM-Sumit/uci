import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useGetNotes } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, Page, SectionTitle } from "@/components/learning";
import { useColors } from "@/hooks/useColors";
import type { Note } from "@/types/content";

const subjects = ["All", "Mathematics", "Reasoning", "English", "General Knowledge"];

export default function NotesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const query = useGetNotes({ search: search.trim() || undefined, subject: subject || undefined });
  const notes = (query.data as unknown as { notes?: Note[] } | undefined)?.notes ?? [];

  return (
    <Page>
      <Text style={[styles.kicker, { color: colors.primary }]}>REVISION LIBRARY</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Notes</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Keep the important ideas close.</Text>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search topics, subjects or exams"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          returnKeyType="search"
          testID="notes-search"
        />
      </View>
      <View style={styles.filters}>
        {subjects.map((item) => {
          const selected = item === "All" ? !subject : subject === item;
          return (
            <Pressable key={item} onPress={() => setSubject(item === "All" ? "" : item)} style={[styles.filter, { backgroundColor: selected ? colors.foreground : colors.card, borderColor: selected ? colors.foreground : colors.border }]}>
              <Text style={{ color: selected ? colors.background : colors.mutedForeground, fontSize: 11, fontWeight: "700" }}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <SectionTitle title="Study notes" />
      {query.isLoading ? <LoadingState label="Loading study notes…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="Notes couldn’t load." /> : null}
      {!query.isLoading && !query.isError && notes.length === 0 ? (
        <EmptyState title="No notes found" description="Try a different search, or check back when new notes are published." />
      ) : null}
      {notes.map((note) => (
        <Pressable key={note.id} onPress={() => router.push({ pathname: "/note/[id]", params: { id: String(note.id) } })} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.accent }]}>
            <Feather name="file-text" size={20} color={colors.accentForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.topline}>
              <Text style={[styles.subject, { color: colors.primary }]}>{note.subject}</Text>
              <Text style={[styles.exam, { color: colors.mutedForeground }]}>{note.exam}</Text>
            </View>
            <Text style={[styles.noteTitle, { color: colors.foreground }]}>{note.title}</Text>
            <Text style={[styles.noteDescription, { color: colors.mutedForeground }]}>{note.description}</Text>
            <View style={styles.open}>
              <Text style={[styles.read, { color: colors.primary }]}>Read notes</Text>
              <Feather name="arrow-up-right" size={14} color={colors.primary} />
            </View>
          </View>
        </Pressable>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, marginTop: 5, marginBottom: 20 },
  search: { height: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  filters: { flexDirection: "row", gap: 7, flexWrap: "wrap", marginTop: 13 },
  filter: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 20 },
  noteCard: { flexDirection: "row", gap: 13, borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 11 },
  icon: { height: 42, width: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  topline: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  subject: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  exam: { fontSize: 10, fontWeight: "600" },
  noteTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  noteDescription: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  open: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 9 },
  read: { fontSize: 11, fontWeight: "800" },
});