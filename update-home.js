const fs = require('fs');

const content = `import React from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetStudentHome, useGetAdminDashboard, useGetAdminResults } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BrandHeader, EmptyState, ErrorState, LoadingState, Page, Panel, ProgressBar, SectionTitle } from "@/components/learning";
import { useAuth } from "@/store/auth";
import { useColors } from "@/hooks/useColors";
import type { Course, HomeData, Note, TestSummary, AdminStats, AdminResult } from "@/types/content";

function CourseRow({ course, onPress }: { course: Course; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.courseRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.courseCover, { backgroundColor: colors.accent }]}>
        {course.thumbnailUrl ? (
          <Image source={{ uri: course.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Ionicons name="school-outline" size={25} color={colors.accentForeground} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.courseMeta, { color: colors.primary }]}>{course.exam}</Text>
        <Text numberOfLines={2} style={[styles.courseTitle, { color: colors.foreground }]}>{course.title}</Text>
        <Text style={[styles.smallText, { color: colors.mutedForeground }]}>{course.lessonCount} lessons · {course.instructor}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function HomeTest({ test, onPress }: { test: TestSummary; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.testRow, { borderColor: colors.border }]}>
      <View style={[styles.testIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="check-square" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.courseTitle, { color: colors.foreground }]}>{test.title}</Text>
        <Text style={[styles.smallText, { color: colors.mutedForeground }]}>{test.questionCount} questions · {test.durationMinutes} min</Text>
      </View>
      <Feather name="arrow-up-right" size={17} color={colors.primary} />
    </Pressable>
  );
}

function NoteRow({ note, onPress }: { note: Note; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.noteRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.noteIcon, { backgroundColor: colors.accent }]}>
        <Feather name="file-text" size={18} color={colors.accentForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.courseTitle, { color: colors.foreground }]}>{note.title}</Text>
        <Text style={[styles.smallText, { color: colors.mutedForeground }]}>{note.subject} · {note.exam}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  // Admin queries
  const dashboardQuery = useGetAdminDashboard({ query: { enabled: isAdmin, staleTime: 0 } });
  const resultsQuery = useGetAdminResults({ query: { enabled: isAdmin, staleTime: 0 } });
  const stats = dashboardQuery.data as unknown as AdminStats | undefined;
  const results = (resultsQuery.data as unknown as { results?: AdminResult[] } | undefined)?.results ?? [];

  // Student query
  const query = useGetStudentHome({ query: { enabled: !isAdmin } });
  const home = query.data as unknown as HomeData | undefined;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const openCourse = (id: number) => router.push({ pathname: "/course/[id]", params: { id: String(id) } });
  const openNote = (id: number) => router.push({ pathname: "/note/[id]", params: { id: String(id) } });
  const openTest = (id: number) => router.push({ pathname: "/test/[id]", params: { id: String(id) } });

  // ── ADMIN HOME ──
  if (isAdmin) {
    return (
      <Page>
        <BrandHeader greeting={greeting} name={user?.name?.split(" ")[0]} onProfile={() => router.navigate("/(tabs)/profile")} />
        <Text style={[styles.adminKicker, { color: colors.primary }]}>ADMIN PANEL</Text>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <AdminActionCard label="Add Course" icon="book-open" color="#6366f1" onPress={() => router.push("/admin-add-course")} />
          <AdminActionCard label="Add Note" icon="file-text" color="#10b981" onPress={() => router.push("/admin-add-note")} />
          <AdminActionCard label="Generate Test" icon="zap" color="#f59e0b" onPress={() => router.push("/admin-generate-test")} />
        </View>

        {/* Stats */}
        {dashboardQuery.isLoading ? <LoadingState label="Loading stats…" /> : null}
        {stats ? (
          <View style={styles.statGrid}>
            <StatCard label="Students" value={stats.students} icon="users" color="#6366f1" />
            <StatCard label="Courses" value={stats.courses} icon="book-open" color="#10b981" />
            <StatCard label="Notes" value={stats.notes} icon="file-text" color="#f59e0b" />
            <StatCard label="Tests" value={stats.tests} icon="check-square" color="#ef4444" />
            <StatCard label="Submissions" value={stats.attempts} icon="bar-chart-2" color="#8b5cf6" />
          </View>
        ) : null}

        {/* Recent Results */}
        <SectionTitle title="Recent Student Results" action="Full Scoreboard" onAction={() => router.push("/admin")} />
        {resultsQuery.isLoading ? <LoadingState label="Loading results…" /> : null}
        {!resultsQuery.isLoading && results.length === 0 ? <EmptyState title="No submissions yet" description="Student test results will appear here." /> : null}
        {results.slice(0, 8).map((r, i) => (
          <Panel key={\`\${r.email}-\${i}\`} style={styles.resultCard}>
            <View style={[styles.resAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.resAvatarText, { color: colors.accentForeground }]}>{(r.studentName ?? "?").slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resName, { color: colors.foreground }]}>{r.studentName}</Text>
              <Text style={[styles.resMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{r.testTitle} · {r.score}/{r.totalQuestions}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.resPct, { color: colors.primary }]}>{r.percentage}%</Text>
              <Text style={[styles.resMeta, { color: colors.mutedForeground }]}>{r.accuracy}% acc</Text>
            </View>
          </Panel>
        ))}
      </Page>
    );
  }

  // ── STUDENT HOME ──
  return (
    <Page>
      <BrandHeader greeting={greeting} name={user?.name?.split(" ")[0]} onProfile={() => router.navigate("/(tabs)/profile")} />
      {query.isLoading ? <LoadingState label="Loading your dashboard…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="Your dashboard couldn't load." /> : null}
      {!query.isLoading && !query.isError && home ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
            {home.banners.length ? home.banners.map((banner, index) => (
              <Pressable key={banner.id} onPress={() => router.navigate("/(tabs)/courses")} accessibilityRole="button" style={styles.bannerWrap}>
                {banner.imageUrl ? (
                  <Image source={{ uri: banner.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={index % 2 ? [colors.foreground, colors.secondaryForeground] : [colors.foreground, colors.primary]} style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.bannerCopy}>
                  <Text style={[styles.bannerEyebrow, { color: colors.primaryForeground, opacity: 0.72 }]}>UCI · GOVERNMENT EXAMS</Text>
                  <Text style={[styles.bannerTitle, { color: colors.primaryForeground }]}>{banner.title}</Text>
                  <Text style={[styles.bannerSubtitle, { color: colors.primaryForeground, opacity: 0.82 }]}>{banner.subtitle}</Text>
                  <View style={[styles.bannerCTA, { backgroundColor: colors.background }]}>
                    <Text style={[styles.bannerCTAText, { color: colors.foreground }]}>{banner.ctaLabel}</Text>
                    <Feather name="arrow-right" size={15} color={colors.foreground} />
                  </View>
                </View>
                <View style={[styles.bannerOrb, { borderColor: colors.primaryForeground, opacity: 0.16 }]} />
              </Pressable>
            )) : (
              <LinearGradient colors={[colors.foreground, colors.primary]} style={styles.bannerWrap}>
                <View style={styles.bannerCopy}>
                  <Text style={[styles.bannerEyebrow, { color: colors.primaryForeground, opacity: 0.72 }]}>UCI · GOVERNMENT EXAMS</Text>
                  <Text style={[styles.bannerTitle, { color: colors.primaryForeground }]}>A stronger start to your preparation.</Text>
                  <Text style={[styles.bannerSubtitle, { color: colors.primaryForeground, opacity: 0.82 }]}>Pick up a lesson, revise a topic, or take a quick test.</Text>
                  <Pressable onPress={() => router.navigate("/(tabs)/courses")} style={[styles.bannerCTA, { backgroundColor: colors.background }]}>
                    <Text style={[styles.bannerCTAText, { color: colors.foreground }]}>Explore courses</Text>
                    <Feather name="arrow-right" size={15} color={colors.foreground} />
                  </Pressable>
                </View>
              </LinearGradient>
            )}
          </ScrollView>

          <SectionTitle title="Continue learning" action="All courses" onAction={() => router.navigate("/(tabs)/courses")} />
          {home.continueLearning ? (
            <Pressable onPress={() => openCourse(home.continueLearning!.courseId)}>
              <Panel>
                <View style={styles.continueTop}>
                  <View style={[styles.continueIcon, { backgroundColor: colors.accent }]}>
                    <Feather name="play" size={16} color={colors.accentForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.courseTitle, { color: colors.foreground }]}>{home.continueLearning.courseTitle}</Text>
                    <Text numberOfLines={1} style={[styles.smallText, { color: colors.mutedForeground }]}>
                      {home.continueLearning.lastLesson ? \`Last lesson · \${home.continueLearning.lastLesson}\` : "Continue your course"}
                    </Text>
                  </View>
                  <Text style={[styles.progressValue, { color: colors.primary }]}>{home.continueLearning.progress}%</Text>
                </View>
                <ProgressBar value={home.continueLearning.progress} />
                <Text style={[styles.lessonProgress, { color: colors.mutedForeground }]}>
                  {home.continueLearning.completedLessons} of {home.continueLearning.lessonCount} lessons complete
                </Text>
              </Panel>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.navigate("/(tabs)/courses")}>
              <EmptyState title="Your next lesson starts here" description="Choose a course and your progress will appear on this screen." />
            </Pressable>
          )}

          <SectionTitle title="Popular courses" action="See all" onAction={() => router.navigate("/(tabs)/courses")} />
          {home.popularCourses.length ? home.popularCourses.map((course) => (
            <CourseRow key={course.id} course={course} onPress={() => openCourse(course.id)} />
          )) : <EmptyState title="Courses are being prepared" description="Published UCI courses will appear here." />}

          <SectionTitle title="Upcoming tests" action="View tests" onAction={() => router.navigate("/(tabs)/tests")} />
          {home.upcomingTests.length ? home.upcomingTests.map((test) => (
            <HomeTest key={test.id} test={test} onPress={() => openTest(test.id)} />
          )) : <EmptyState title="No tests scheduled" description="New practice tests will appear here when available." />}

          <SectionTitle title="Latest notes" action="Browse notes" onAction={() => router.navigate("/(tabs)/notes")} />
          {home.latestNotes.length ? home.latestNotes.map((note) => (
            <NoteRow key={note.id} note={note} onPress={() => openNote(note.id)} />
          )) : <EmptyState title="No notes published yet" description="Study notes will appear here as they are added." />}
        </>
      ) : null}
    </Page>
  );
}

function AdminActionCard({ label, icon, color, onPress }: { label: string; icon: any; color: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.actionCard, { backgroundColor: color + "15", borderColor: color + "30" }]}>
      <View style={[styles.actionIcon, { backgroundColor: color + "25" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colors = useColors();
  return (
    <Panel style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  adminKicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  actionCard: { flex: 1, alignItems: "center", borderRadius: 18, borderWidth: 1, paddingVertical: 14, gap: 7 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  statGrid: { flexDirection: "row", gap: 9, flexWrap: "wrap", marginBottom: 4 },
  statCard: { width: "48%", padding: 12, minHeight: 95 },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20, fontWeight: "800", marginTop: 8 },
  statLabel: { fontSize: 10, marginTop: 2 },
  resultCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 11, marginBottom: 7 },
  resAvatar: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  resAvatarText: { fontSize: 14, fontWeight: "800" },
  resName: { fontSize: 12, fontWeight: "700" },
  resMeta: { fontSize: 10, marginTop: 2 },
  resPct: { fontSize: 16, fontWeight: "800" },
  bannerWrap: { width: 326, height: 216, borderRadius: 25, overflow: "hidden", justifyContent: "center" },
  bannerCopy: { paddingHorizontal: 22, paddingVertical: 20, width: "82%", zIndex: 2 },
  bannerEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.1, marginBottom: 10 },
  bannerTitle: { fontSize: 24, lineHeight: 29, fontWeight: "800", letterSpacing: -0.6 },
  bannerSubtitle: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  bannerCTA: { marginTop: 15, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8 },
  bannerCTAText: { fontSize: 12, fontWeight: "700" },
  bannerOrb: { position: "absolute", width: 168, height: 168, borderRadius: 100, borderWidth: 1, right: -47, top: 16 },
  courseRow: { flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 20, borderWidth: 1, padding: 11, marginBottom: 10 },
  courseCover: { width: 62, height: 62, borderRadius: 16, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  courseMeta: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 4 },
  courseTitle: { fontSize: 14, lineHeight: 19, fontWeight: "700" },
  smallText: { fontSize: 12, marginTop: 4 },
  continueTop: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 16 },
  continueIcon: { height: 38, width: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  progressValue: { fontSize: 14, fontWeight: "800" },
  lessonProgress: { fontSize: 11, marginTop: 9 },
  testRow: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, paddingVertical: 13 },
  testIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, padding: 12, marginBottom: 9 },
  noteIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
`;

fs.writeFileSync('artifacts/uci-education/app/(tabs)/home.tsx', content, 'utf8');
console.log('Fixed home.tsx');
