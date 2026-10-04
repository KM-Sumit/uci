import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useGetTests } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, Page, SectionTitle } from "@/components/learning";
import { useColors } from "@/hooks/useColors";
import type { TestSummary } from "@/types/content";

export default function TestsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const query = useGetTests({ search: search.trim() || undefined });
  const tests = (query.data as unknown as { tests?: TestSummary[] } | undefined)?.tests ?? [];

  return (
    <Page>
      <Text style={[styles.kicker, { color: colors.primary }]}>PRACTICE WITH PURPOSE</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Tests</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Short, focused practice to check your progress.</Text>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search tests or topics" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} testID="tests-search" />
      </View>
      <SectionTitle title="Practice tests" />
      {query.isLoading ? <LoadingState label="Loading tests…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="Tests couldn’t load." /> : null}
      {!query.isLoading && !query.isError && tests.length === 0 ? <EmptyState title="No practice tests yet" description="New tests will appear here when they are published." /> : null}
      {tests.map((test) => (
        <Pressable key={test.id} onPress={() => router.push({ pathname: "/test/[id]", params: { id: String(test.id) } })} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.accent }]}><Feather name="check-square" size={19} color={colors.accentForeground} /></View>
          <View style={{ flex: 1 }}>
            <View style={styles.topline}>
              <Text style={[styles.subject, { color: colors.primary }]}>{test.subject}</Text>
              <Text style={[styles.difficulty, { color: colors.mutedForeground }]}>{test.difficulty}</Text>
            </View>
            <Text style={[styles.testTitle, { color: colors.foreground }]}>{test.title}</Text>
            <Text style={[styles.details, { color: colors.mutedForeground }]}>{test.topic} · {test.questionCount} questions · {test.durationMinutes} min</Text>
            <View style={styles.bottom}>
              <Text style={[styles.start, { color: colors.primary }]}>{test.attempted ? "Try again" : "Start test"}</Text>
              <Feather name="arrow-up-right" size={15} color={colors.primary} />
            </View>
          </View>
        </Pressable>
      ))}
      <SectionTitle title="Your recent results" action="See history" onAction={() => router.navigate("/(tabs)/profile")} />
      <Pressable onPress={() => router.navigate("/(tabs)/profile")} style={[styles.historyLink, { backgroundColor: colors.secondary }]}>
        <Feather name="bar-chart-2" size={17} color={colors.primary} />
        <Text style={[styles.historyText, { color: colors.foreground }]}>Review your test history and progress</Text>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 20 },
  search: { height: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  card: { flexDirection: "row", gap: 13, borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 11 },
  icon: { height: 42, width: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  topline: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  subject: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  difficulty: { fontSize: 10, fontWeight: "600" },
  testTitle: { fontSize: 14, lineHeight: 19, fontWeight: "800" },
  details: { fontSize: 12, marginTop: 5 },
  bottom: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 11 },
  start: { fontSize: 12, fontWeight: "800" },
  historyLink: { minHeight: 48, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  historyText: { flex: 1, fontSize: 12, fontWeight: "700" },
});