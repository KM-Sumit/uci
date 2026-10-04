import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useGetTestAttempts } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, Page, Panel, SectionTitle } from "@/components/learning";
import { useAuth } from "@/store/auth";
import { useColors } from "@/hooks/useColors";
import type { AttemptResult } from "@/types/content";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const historyQuery = useGetTestAttempts();
  const attempts = (historyQuery.data as unknown as { attempts?: AttemptResult[] } | undefined)?.attempts ?? [];

  return (
    <Page>
      <Text style={[styles.kicker, { color: colors.primary }]}>YOUR UCI ACCOUNT</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      <Panel style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.accentForeground }]}>{user?.name?.slice(0, 1).toUpperCase() ?? "U"}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{user?.name}</Text>
        <Text style={[styles.contact, { color: colors.mutedForeground }]}>{user?.email}</Text>
        <Text style={[styles.contact, { color: colors.mutedForeground }]}>{user?.mobile}</Text>
      </Panel>
      <SectionTitle title="Your learning" />
      <View style={styles.statRow}>
        <Panel style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>{attempts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Tests taken</Text>
        </Panel>
        <Panel style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.foreground }]}>{attempts.length ? `${Math.round(attempts.reduce((total, item) => total + item.percentage, 0) / attempts.length)}%` : "—"}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Average score</Text>
        </Panel>
      </View>
      {user?.role === "admin" ? (
        <Pressable onPress={() => router.push("/admin")} style={[styles.adminLink, { backgroundColor: colors.foreground }]}>
          <Feather name="shield" size={17} color={colors.background} />
          <Text style={[styles.adminText, { color: colors.background }]}>Open admin dashboard</Text>
          <Feather name="arrow-up-right" size={16} color={colors.background} />
        </Pressable>
      ) : null}
      <SectionTitle title="Test history" />
      {historyQuery.isLoading ? <LoadingState label="Loading your results…" /> : null}
      {historyQuery.isError ? <ErrorState onRetry={() => void historyQuery.refetch()} label="Test history couldn’t load." /> : null}
      {!historyQuery.isLoading && !historyQuery.isError && attempts.length === 0 ? <EmptyState title="No tests taken yet" description="Your completed practice tests and scores will appear here." /> : null}
      {attempts.map((attempt) => (
        <Pressable key={attempt.id} onPress={() => router.push({ pathname: "/result/[id]", params: { id: String(attempt.id) } })} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.historyTitle, { color: colors.foreground }]}>{attempt.testTitle}</Text>
            <Text style={[styles.contact, { color: colors.mutedForeground }]}>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : ""} · {attempt.correct}/{attempt.totalQuestions} correct</Text>
          </View>
          <View style={styles.score}>
            <Text style={[styles.scoreText, { color: colors.primary }]}>{attempt.percentage}%</Text>
            <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
          </View>
        </Pressable>
      ))}
      <Pressable onPress={() => void signOut()} style={[styles.signOut, { borderColor: colors.border }]} testID="sign-out-button">
        <Feather name="log-out" size={17} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign out</Text>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  profileCard: { alignItems: "center", paddingVertical: 22, marginTop: 18 },
  avatar: { width: 67, height: 67, borderRadius: 23, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "800" },
  contact: { fontSize: 12, marginTop: 5 },
  statRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 15 },
  statNumber: { fontSize: 23, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 4 },
  adminLink: { minHeight: 48, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 15 },
  adminText: { flex: 1, fontSize: 12, fontWeight: "700" },
  historyCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 9 },
  historyTitle: { fontSize: 13, fontWeight: "700" },
  score: { flexDirection: "row", alignItems: "center", gap: 7 },
  scoreText: { fontSize: 14, fontWeight: "800" },
  signOut: { flexDirection: "row", gap: 9, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 15, height: 48, marginTop: 16 },
  signOutText: { fontSize: 13, fontWeight: "700" },
});