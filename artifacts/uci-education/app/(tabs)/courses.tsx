import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useGetCourses } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, Page, SectionTitle } from "@/components/learning";
import { useColors } from "@/hooks/useColors";
import type { Course } from "@/types/content";

const exams = ["All", "SSC", "Banking", "Railway", "Police", "UPSC"];

export default function CoursesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [exam, setExam] = useState("");
  const query = useGetCourses({ search: search.trim() || undefined, exam: exam || undefined });
  const courses = (query.data as unknown as { courses?: Course[] } | undefined)?.courses ?? [];

  return (
    <Page>
      <Text style={[styles.kicker, { color: colors.primary }]}>YOUR STUDY PLAN</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>Courses</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Focused classes for your next exam.</Text>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search courses or exams"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          returnKeyType="search"
          testID="courses-search"
        />
        {search ? <Pressable onPress={() => setSearch("")} accessibilityLabel="Clear search"><Feather name="x" size={17} color={colors.mutedForeground} /></Pressable> : null}
      </View>
      <View style={styles.filters}>
        {exams.map((item) => {
          const selected = item === "All" ? !exam : exam === item;
          return (
            <Pressable key={item} onPress={() => setExam(item === "All" ? "" : item)} style={[styles.filter, { backgroundColor: selected ? colors.foreground : colors.card, borderColor: selected ? colors.foreground : colors.border }]}>
              <Text style={{ color: selected ? colors.background : colors.mutedForeground, fontSize: 12, fontWeight: "700" }}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <SectionTitle title={courses.length ? `${courses.length} courses` : "Available courses"} />
      {query.isLoading ? <LoadingState label="Finding courses…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="Courses couldn’t load." /> : null}
      {!query.isLoading && !query.isError && courses.length === 0 ? (
        <EmptyState title="No matching courses" description={search ? "Try another course name or exam." : "Published courses will appear here."} />
      ) : null}
      {courses.map((course) => (
        <Pressable key={course.id} onPress={() => router.push({ pathname: "/course/[id]", params: { id: String(course.id) } })} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cover, { backgroundColor: colors.accent }]}>
            {course.thumbnailUrl ? <Image source={{ uri: course.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Ionicons name="school-outline" size={27} color={colors.accentForeground} />}
            <View style={[styles.examTag, { backgroundColor: colors.card }]}><Text style={[styles.tagText, { color: colors.foreground }]}>{course.exam}</Text></View>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.instructorRow}>
              <Text style={[styles.category, { color: colors.primary }]}>{course.category}</Text>
              <Text style={[styles.price, { color: colors.primary }]}>{course.priceCents > 0 ? `₹${Math.round(course.priceCents / 100)}` : "FREE"}</Text>
            </View>
            <Text style={[styles.courseTitle, { color: colors.foreground }]}>{course.title}</Text>
            <Text numberOfLines={2} style={[styles.description, { color: colors.mutedForeground }]}>{course.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}><Feather name="user" size={12} color={colors.mutedForeground} />  {course.instructor}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{course.lessonCount} lessons · {course.durationMinutes} min</Text>
            </View>
            <View style={[styles.openButton, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.openLabel, { color: colors.foreground }]}>View course</Text>
              <Feather name="arrow-up-right" size={15} color={colors.foreground} />
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
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 13 },
  filter: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 20 },
  card: { borderWidth: 1, borderRadius: 23, overflow: "hidden", marginBottom: 14 },
  cover: { height: 118, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  examTag: { position: "absolute", left: 13, top: 13, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: "800" },
  cardBody: { padding: 15 },
  instructorRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  category: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.9 },
  price: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  courseTitle: { fontSize: 16, lineHeight: 22, fontWeight: "800" },
  description: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", gap: 6, marginTop: 13, flexWrap: "wrap" },
  meta: { fontSize: 11 },
  openButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 11, borderRadius: 13, marginTop: 13 },
  openLabel: { fontSize: 12, fontWeight: "700" },
});