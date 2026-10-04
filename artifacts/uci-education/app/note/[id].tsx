import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useGetNote } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, Page, Panel } from "@/components/learning";
import { useColors } from "@/hooks/useColors";
import type { Note } from "@/types/content";

export default function NoteDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = Number(id);
  const query = useGetNote(noteId);
  const note = (query.data as unknown as { note?: Note } | undefined)?.note;

  return (
    <Page>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={16} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Notes</Text>
      </Pressable>
      {query.isLoading ? <LoadingState label="Opening study note…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="This note couldn’t load." /> : null}
      {!query.isLoading && !query.isError && !note ? <EmptyState title="Note not found" description="This note may have been unpublished." /> : null}
      {note ? (
        <>
          <Text style={[styles.subject, { color: colors.primary }]}>{note.subject} · {note.exam}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{note.title}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{note.description}</Text>
          <Panel style={styles.notePanel}>
            {(note.body || "").split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
              <Text key={index} style={[styles.body, { color: colors.foreground }]}>{paragraph}</Text>
            ))}
          </Panel>
          {note.pdfUrl ? (
            <Pressable onPress={() => void Linking.openURL(note.pdfUrl!)} style={[styles.pdfButton, { backgroundColor: colors.primary }]}>
              <Feather name="download" size={16} color={colors.primaryForeground} />
              <Text style={[styles.pdfText, { color: colors.primaryForeground }]}>Open PDF</Text>
            </Pressable>
          ) : null}
          {note.createdAt ? <Text style={[styles.date, { color: colors.mutedForeground }]}>Published {new Date(note.createdAt).toLocaleDateString()}</Text> : null}
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 22 },
  backText: { fontSize: 13, fontWeight: "700" },
  subject: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 9 },
  title: { fontSize: 27, lineHeight: 33, fontWeight: "800", letterSpacing: -0.7 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  notePanel: { gap: 15 },
  body: { fontSize: 14, lineHeight: 23 },
  pdfButton: { height: 47, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, marginTop: 16 },
  pdfText: { fontSize: 13, fontWeight: "800" },
  date: { fontSize: 11, textAlign: "center", marginTop: 15 },
});