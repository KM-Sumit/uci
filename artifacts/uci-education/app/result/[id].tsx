import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useGetTestAttempt } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, Page, Panel, SectionTitle } from "@/components/learning";
import { useColors } from "@/hooks/useColors";
import type { AttemptResult } from "@/types/content";

interface ReviewItem {
  id: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  selectedOption: number | null;
  isCorrect: boolean;
  explanation: string;
}

interface ResultPayload {
  attempt: AttemptResult;
  review: ReviewItem[];
}

export default function TestResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const attemptId = Number(id);
  const query = useGetTestAttempt(attemptId);
  const payload = query.data as unknown as ResultPayload | undefined;
  const attempt = payload?.attempt;
  const review = payload?.review ?? [];

  return (
    <Page>
      <Pressable onPress={() => router.replace("/(tabs)/profile")} style={styles.back}>
        <Feather name="arrow-left" size={16} color={colors.foreground} />
        <Text style={[styles.backText, { color: colors.foreground }]}>Test history</Text>
      </Pressable>
      {query.isLoading ? <LoadingState label="Calculating your result…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} label="This result couldn’t load." /> : null}
      {!query.isLoading && !query.isError && !attempt ? <EmptyState title="Result not found" description="This result may not belong to your account." /> : null}
      {attempt ? (
        <>
          <View style={[styles.resultHero, { backgroundColor: colors.foreground }]}>
            <View style={[styles.scoreRing, { borderColor: colors.primary }]}>
              <Text style={[styles.scorePercent, { color: colors.primaryForeground }]}>{attempt.percentage}%</Text>
              <Text style={[styles.scoreLabel, { color: colors.primaryForeground, opacity: 0.7 }]}>SCORE</Text>
            </View>
            <Text style={[styles.resultTitle, { color: colors.primaryForeground }]}>Test complete</Text>
            <Text style={[styles.testTitle, { color: colors.primaryForeground, opacity: 0.78 }]}>{attempt.testTitle}</Text>
          </View>
          <View style={styles.metrics}>
            <Metric value={String(attempt.correct)} label="Correct" icon="check-circle" tone={colors.primary} />
            <Metric value={String(attempt.wrong)} label="Incorrect" icon="x-circle" tone={colors.destructive} />
            <Metric value={String(attempt.unattempted)} label="Skipped" icon="minus-circle" tone={colors.mutedForeground} />
          </View>
          <Panel style={styles.summary}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Your performance</Text>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Accuracy</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{attempt.accuracy}%</Text></View>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Questions correct</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{attempt.correct}/{attempt.totalQuestions}</Text></View>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Time used</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{Math.floor(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s</Text></View>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Submitted</Text><Text style={[styles.summaryValue, { color: colors.foreground }]}>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : "—"}</Text></View>
          </Panel>
          <SectionTitle title="Answer review" />
          {review.map((item, index) => (
            <Panel key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={[styles.reviewNumber, { color: colors.primary }]}>QUESTION {index + 1}</Text>
                <View style={[styles.badge, { backgroundColor: item.isCorrect ? colors.accent : colors.secondary }]}>
                  <Text style={[styles.badgeText, { color: item.isCorrect ? colors.accentForeground : colors.mutedForeground }]}>{item.isCorrect ? "Correct" : item.selectedOption === null ? "Skipped" : "Incorrect"}</Text>
                </View>
              </View>
              <Text style={[styles.prompt, { color: colors.foreground }]}>{item.prompt}</Text>
              {item.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === item.correctIndex;
                const wasSelected = optionIndex === item.selectedOption;
                return (
                  <View key={optionIndex} style={[styles.answerOption, { backgroundColor: isCorrect ? colors.accent : wasSelected ? colors.secondary : colors.background }]}>
                    <Feather name={isCorrect ? "check" : wasSelected ? "x" : "circle"} size={14} color={isCorrect ? colors.accentForeground : wasSelected ? colors.mutedForeground : colors.border} />
                    <Text style={[styles.answerText, { color: colors.foreground }]}>{option}</Text>
                    {wasSelected ? <Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>Your answer</Text> : null}
                  </View>
                );
              })}
              {item.explanation ? <Text style={[styles.explanation, { color: colors.mutedForeground }]}>{item.explanation}</Text> : null}
            </Panel>
          ))}
          <Pressable onPress={() => router.replace("/(tabs)/tests")} style={[styles.againButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.againText, { color: colors.primaryForeground }]}>Practice another test</Text>
            <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
          </Pressable>
        </>
      ) : null}
    </Page>
  );
}

function Metric({ value, label, icon, tone }: { value: string; label: string; icon: keyof typeof Feather.glyphMap; tone: string }) {
  const colors = useColors();
  return (
    <Panel style={styles.metric}>
      <Feather name={icon} size={17} color={tone} />
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 16 },
  backText: { fontSize: 13, fontWeight: "700" },
  resultHero: { alignItems: "center", borderRadius: 25, paddingVertical: 24, paddingHorizontal: 18 },
  scoreRing: { width: 108, height: 108, borderRadius: 54, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  scorePercent: { fontSize: 29, fontWeight: "800" },
  scoreLabel: { fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  resultTitle: { fontSize: 21, fontWeight: "800", marginTop: 13 },
  testTitle: { fontSize: 12, marginTop: 5, textAlign: "center" },
  metrics: { flexDirection: "row", gap: 8, marginTop: 12 },
  metric: { flex: 1, padding: 11, alignItems: "center", gap: 5 },
  metricValue: { fontSize: 19, fontWeight: "800" },
  metricLabel: { fontSize: 10 },
  summary: { marginTop: 13, gap: 13 },
  summaryTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 12, fontWeight: "800" },
  reviewCard: { marginBottom: 10 },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewNumber: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: "800" },
  prompt: { fontSize: 14, lineHeight: 20, fontWeight: "700", marginTop: 13, marginBottom: 10 },
  answerOption: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 11, paddingHorizontal: 9, paddingVertical: 9, marginTop: 5 },
  answerText: { flex: 1, fontSize: 11, lineHeight: 16 },
  selectedLabel: { fontSize: 8, fontWeight: "700" },
  explanation: { fontSize: 11, lineHeight: 17, marginTop: 10 },
  againButton: { height: 48, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 5 },
  againText: { fontSize: 12, fontWeight: "800" },
});