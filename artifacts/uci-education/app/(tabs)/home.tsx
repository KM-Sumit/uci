import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetStudentHome } from "@workspace/api-client-react";
import { BrandHeader, EmptyState, ErrorState, LoadingState, Page, Panel, ProgressBar, SectionTitle } from "@/components/learning";
import { useAuth } from "@/store/auth";
import { useColors } from "@/hooks/useColors";
import type { Course, HomeData, Note, TestSummary } from "@/types/content";

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
  const query = useGetStudentHome();
  const home = query.data as unknown as HomeData | undefined;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const openCourse = (id: number) => router.push({ pathname: "/course/[id]", params: { id: String(id) } });
  const openNote = (id: number) => router.push({ pathname: "/note/[id]", params: { id: String(id) } });
  const openTest = (id: number) => router.push({ pathname: "/test/[id]", params: { id: String(id) } });

  return (
    <Page>
      <BrandHeader greeting={greeting} name={user?.name?.split(" ")[0]} onProfile={() => router.navigate("/(tabs)/profile")} />
      {query.isLoading ? <LoadingState label="Loading your dashboard…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="Your dashboard couldn’t load." /> : null}
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
                      {home.continueLearning.lastLesson ? `Last lesson · ${home.continueLearning.lastLesson}` : "Continue your course"}
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

const styles = StyleSheet.create({
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
