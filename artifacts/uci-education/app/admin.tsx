import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useGetAdminDashboard, useGetAdminResults } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, Page, Panel, SectionTitle } from "@/components/learning";
import { useAuth } from "@/store/auth";
import { useColors } from "@/hooks/useColors";
import type { AdminResult, AdminStats } from "@/types/content";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const dashboardQuery = useGetAdminDashboard();
  const resultsQuery = useGetAdminResults();
  const stats = dashboardQuery.data as unknown as AdminStats | undefined;
  const results = (resultsQuery.data as unknown as { results?: AdminResult[] } | undefined)?.results ?? [];

  return (
    <Page>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={16} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Profile</Text>
      </Pressable>
      <Text style={[styles.kicker, { color: colors.primary }]}>UCI ADMINISTRATION</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Student activity and published learning content.</Text>
      {dashboardQuery.isLoading ? <LoadingState label="Loading admin dashboard…" /> : null}
      {dashboardQuery.isError ? <ErrorState onRetry={() => void dashboardQuery.refetch()} label="You may not have admin access, or the dashboard is unavailable." /> : null}
      {stats ? (
        <View style={styles.statGrid}>
          <Stat label="Students" value={stats.students} icon="users" />
          <Stat label="Courses" value={stats.courses} icon="book-open" />
          <Stat label="Study notes" value={stats.notes} icon="file-text" />
          <Stat label="Tests" value={stats.tests} icon="check-square" />
          <Stat label="Completed tests" value={stats.attempts} icon="bar-chart-2" />
        </View>
      ) : null}
      <SectionTitle title="Recent test results" />
      {resultsQuery.isLoading ? <LoadingState label="Loading student results…" /> : null}
      {resultsQuery.isError ? <ErrorState onRetry={() => void resultsQuery.refetch()} label="Student results couldn’t load." /> : null}
      {!resultsQuery.isLoading && !resultsQuery.isError && results.length === 0 ? <EmptyState title="No completed tests yet" description="Submitted test results will appear here." /> : null}
      {results.map((result, index) => (
        <Panel key={`${result.email}-${result.submittedAt}-${index}`} style={styles.resultCard}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.accentForeground }]}>{result.studentName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.student, { color: colors.foreground }]}>{result.studentName}</Text>
            <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{result.email}</Text>
            <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{result.testTitle} · {result.score}/{result.totalQuestions}</Text>
          </View>
          <View style={styles.scoreWrap}>
            <Text style={[styles.score, { color: colors.primary }]}>{result.percentage}%</Text>
            <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{result.accuracy}% acc.</Text>
          </View>
        </Panel>
      ))}
      <Panel style={styles.notice}>
        <Feather name="info" size={17} color={colors.primary} />
        <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>This first release includes admin overview and student results. Content editing, media uploads, and AI test generation are not enabled yet.</Text>
      </Panel>
    </Page>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <Panel style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: colors.accent }]}><Feather name={icon} size={15} color={colors.accentForeground} /></View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 21 },
  backText: { fontSize: 13, fontWeight: "700" },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 5 },
  title: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 13 },
  statGrid: { flexDirection: "row", gap: 9, flexWrap: "wrap" },
  stat: { width: "48%", padding: 13, minHeight: 105 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 21, fontWeight: "800", marginTop: 9 },
  statLabel: { fontSize: 10, marginTop: 2 },
  resultCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "800" },
  student: { fontSize: 12, fontWeight: "800" },
  resultMeta: { fontSize: 9, marginTop: 3 },
  scoreWrap: { alignItems: "flex-end" },
  score: { fontSize: 17, fontWeight: "800" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 15 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
});