import React, { useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { completeLesson, useGetCourse } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState, Page, Panel, ProgressBar, SectionTitle } from "@/components/learning";
import { useColors } from "@/hooks/useColors";
import type { Course, Lesson } from "@/types/content";

interface CoursePayload {
  course: Course;
  lessons: Lesson[];
}

export default function CourseDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const courseId = Number(params.id);
  const queryClient = useQueryClient();
  const query = useGetCourse(courseId);
  const data = query.data as unknown as CoursePayload | undefined;
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const course = data?.course;
  const lessons = data?.lessons ?? [];
  const currentLesson = lessons.find((lesson) => lesson.id === selectedLesson) ?? lessons.find((lesson) => !lesson.completed) ?? lessons[0];
  const completed = lessons.filter((lesson) => lesson.completed).length;
  const progress = course?.lessonCount ? Math.round((completed / course.lessonCount) * 100) : 0;
  let lastChapter = -1;

  async function markComplete(lesson: Lesson) {
    if (!lesson.id || lesson.completed || saving) return;
    setSaving(true);
    setError("");
    try {
      await completeLesson(lesson.id);
      await queryClient.invalidateQueries({ queryKey: query.queryKey });
      await queryClient.invalidateQueries({ queryKey: ["/api/student/home"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save lesson progress.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Feather name="arrow-left" size={16} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Courses</Text>
      </Pressable>
      {query.isLoading ? <LoadingState label="Opening your course…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="This course couldn’t load." /> : null}
      {!query.isLoading && !query.isError && !course ? <EmptyState title="Course not found" description="This course may have been unpublished." /> : null}
      {course ? (
        <>
          <View style={[styles.hero, { backgroundColor: colors.foreground }]}>
            {course.thumbnailUrl ? <Image source={{ uri: course.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : (
              <Ionicons name="school-outline" size={37} color={colors.primaryForeground} />
            )}
            <Text style={[styles.heroExam, { color: colors.primaryForeground }]}>{course.exam} · {course.category}</Text>
          </View>
          <Text style={[styles.kicker, { color: colors.primary }]}>{course.instructor}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{course.title}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{course.description}</Text>
          <View style={styles.facts}>
            <Fact icon="book-open" value={`${course.lessonCount} lessons`} />
            <Fact icon="clock" value={`${course.durationMinutes} min`} />
            <Fact icon="tag" value={course.priceCents > 0 ? `₹${Math.round(course.priceCents / 100)}` : "Free"} />
          </View>
          <Panel>
            <View style={styles.progressRow}>
              <Text style={[styles.progressTitle, { color: colors.foreground }]}>Course progress</Text>
              <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress}%</Text>
            </View>
            <ProgressBar value={progress} />
            <Text style={[styles.progressCopy, { color: colors.mutedForeground }]}>{completed} of {course.lessonCount} lessons complete</Text>
          </Panel>

          <SectionTitle title="Course lessons" />
          {lessons.length === 0 ? <EmptyState title="Lessons not published" description="The instructor has not added lessons to this course yet." /> : null}
          {lessons.map((lesson) => {
            const showChapter = lesson.chapterId !== lastChapter;
            lastChapter = lesson.chapterId;
            const isCurrent = currentLesson?.id === lesson.id;
            return (
              <React.Fragment key={lesson.id ?? `${lesson.chapterId}-empty`}>
                {showChapter ? <Text style={[styles.chapter, { color: colors.mutedForeground }]}>{lesson.chapterTitle}</Text> : null}
                <Pressable onPress={() => lesson.id && setSelectedLesson(lesson.id)} style={[styles.lessonRow, { backgroundColor: colors.card, borderColor: isCurrent ? colors.primary : colors.border }]}>
                  <View style={[styles.lessonState, { backgroundColor: lesson.completed ? colors.primary : colors.secondary }]}>
                    <Feather name={lesson.completed ? "check" : lesson.kind === "video" ? "play" : "file-text"} size={15} color={lesson.completed ? colors.primaryForeground : colors.foreground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.lessonTitle, { color: colors.foreground }]}>{lesson.title ?? "Lesson coming soon"}</Text>
                    <Text style={[styles.lessonMeta, { color: colors.mutedForeground }]}>{lesson.durationMinutes ?? 0} min · {lesson.kind ?? "lesson"}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              </React.Fragment>
            );
          })}

          {currentLesson?.body ? (
            <Panel style={styles.lessonPanel}>
              <Text style={[styles.lessonHeading, { color: colors.foreground }]}>{currentLesson.title}</Text>
              <Text style={[styles.lessonBody, { color: colors.mutedForeground }]}>{currentLesson.body}</Text>
              {currentLesson.resourceUrl ? (
                <Pressable onPress={() => void Linking.openURL(currentLesson.resourceUrl!)} style={[styles.resourceButton, { backgroundColor: colors.secondary }]}>
                  <Feather name="external-link" size={15} color={colors.foreground} />
                  <Text style={[styles.resourceLabel, { color: colors.foreground }]}>Open lesson resource</Text>
                </Pressable>
              ) : null}
              {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
              <Pressable disabled={currentLesson.completed || saving} onPress={() => void markComplete(currentLesson)} style={[styles.completeButton, { backgroundColor: currentLesson.completed ? colors.secondary : colors.primary, opacity: saving ? 0.7 : 1 }]}>
                <Feather name={currentLesson.completed ? "check-circle" : "check"} size={16} color={currentLesson.completed ? colors.foreground : colors.primaryForeground} />
                <Text style={[styles.completeText, { color: currentLesson.completed ? colors.foreground : colors.primaryForeground }]}>{saving ? "Saving…" : currentLesson.completed ? "Lesson completed" : "Mark lesson complete"}</Text>
              </Pressable>
            </Panel>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

function Fact({ icon, value }: { icon: keyof typeof Feather.glyphMap; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.fact, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={[styles.factText, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 16 },
  backText: { fontSize: 13, fontWeight: "700" },
  hero: { height: 156, borderRadius: 24, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 17 },
  heroExam: { position: "absolute", left: 16, bottom: 14, fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  kicker: { fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  description: { fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 15 },
  facts: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  fact: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  factText: { fontSize: 11, fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 11 },
  progressTitle: { fontSize: 13, fontWeight: "700" },
  progressPercent: { fontSize: 13, fontWeight: "800" },
  progressCopy: { fontSize: 11, marginTop: 8 },
  chapter: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 7, marginBottom: 8 },
  lessonRow: { flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderRadius: 16, padding: 11, marginBottom: 8 },
  lessonState: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lessonTitle: { fontSize: 12, lineHeight: 17, fontWeight: "700" },
  lessonMeta: { fontSize: 10, marginTop: 3, textTransform: "capitalize" },
  lessonPanel: { marginTop: 8 },
  lessonHeading: { fontSize: 16, lineHeight: 22, fontWeight: "800", marginBottom: 10 },
  lessonBody: { fontSize: 13, lineHeight: 21 },
  resourceButton: { minHeight: 40, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderRadius: 12, marginTop: 14 },
  resourceLabel: { fontSize: 12, fontWeight: "700" },
  error: { fontSize: 12, marginTop: 11 },
  completeButton: { minHeight: 46, borderRadius: 14, marginTop: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  completeText: { fontSize: 12, fontWeight: "800" },
});