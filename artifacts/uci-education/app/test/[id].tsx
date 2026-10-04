import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { startTest, submitTest } from "@workspace/api-client-react";
import { EmptyState, LoadingState, Page, ProgressBar } from "@/components/learning";
import { useColors } from "@/hooks/useColors";
import type { TestAttemptSession } from "@/types/content";

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export default function TestSessionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const testId = Number(id);
  const started = useRef(false);
  const submitting = useRef(false);
  const [session, setSession] = useState<TestAttemptSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [marked, setMarked] = useState<number[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(testId) || testId < 1 || started.current) return;
    started.current = true;
    let active = true;
    void startTest(testId)
      .then((response) => {
        if (!active) return;
        const result = response as unknown as TestAttemptSession;
        setSession(result);
        setSecondsLeft(Math.max(0, Math.ceil((new Date(result.deadline).getTime() - Date.now()) / 1000)));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not start this test."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [testId]);

  async function submit(auto = false) {
    if (!session || submitting.current) return;
    submitting.current = true;
    setError("");
    try {
      const response = await submitTest(session.attemptId, {
        answers: Object.fromEntries(session.questions.map((question) => [String(question.id), answers[question.id] ?? null])),
      });
      const result = response as unknown as { attemptId: number };
      router.replace({ pathname: "/result/[id]", params: { id: String(result.attemptId) } });
    } catch (reason) {
      submitting.current = false;
      setError(reason instanceof Error ? reason.message : "Could not submit your answers.");
      if (auto) setSecondsLeft(1);
    }
  }

  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(session.deadline).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) void submit(true);
    }, 500);
    return () => clearInterval(timer);
  }, [session, answers]);

  function confirmSubmit() {
    const count = Object.values(answers).filter((value) => value !== null && value !== undefined).length;
    const prompt = count < (session?.questions.length ?? 0)
      ? `You answered ${count} of ${session?.questions.length ?? 0} questions. Submit your test?`
      : "Submit your test now?";
    if (Platform.OS === "web") {
      if (globalThis.confirm(prompt)) void submit();
    } else {
      Alert.alert("Submit test?", prompt, [
        { text: "Keep working", style: "cancel" },
        { text: "Submit", style: "default", onPress: () => void submit() },
      ]);
    }
  }

  const question = session?.questions[questionIndex];
  const questionCount = session?.questions.length ?? 0;
  const answeredCount = Object.values(answers).filter((value) => value !== null && value !== undefined).length;

  return (
    <Page>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Exit test" style={[styles.exit, { backgroundColor: colors.secondary }]}>
          <Feather name="x" size={18} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.topTitle, { color: colors.foreground }]}>{session?.test.title ?? "Practice test"}</Text>
          <Text style={[styles.topMeta, { color: colors.mutedForeground }]}>{answeredCount}/{questionCount} answered</Text>
        </View>
        <View style={[styles.timer, { backgroundColor: secondsLeft < 60 ? colors.destructive : colors.foreground }]}>
          <Feather name="clock" size={13} color={colors.primaryForeground} />
          <Text style={[styles.timerText, { color: colors.primaryForeground }]}>{formatTimer(secondsLeft)}</Text>
        </View>
      </View>

      {loading ? <LoadingState label="Preparing your test…" /> : null}
      {error && !session ? (
        <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          <Pressable onPress={() => router.back()}><Text style={[styles.errorLink, { color: colors.primary }]}>Back to tests</Text></Pressable>
        </View>
      ) : null}
      {!loading && session && question ? (
        <>
          <ProgressBar value={questionCount ? ((questionIndex + 1) / questionCount) * 100 : 0} />
          <View style={styles.questionTop}>
            <Text style={[styles.questionCount, { color: colors.primary }]}>QUESTION {questionIndex + 1} <Text style={{ color: colors.mutedForeground }}>/ {questionCount}</Text></Text>
            <Pressable
              onPress={() => setMarked((prev) => prev.includes(question.id) ? prev.filter((id) => id !== question.id) : [...prev, question.id])}
              style={[styles.markButton, { backgroundColor: marked.includes(question.id) ? colors.accent : colors.card, borderColor: colors.border }]}
            >
              <Feather name="bookmark" size={14} color={marked.includes(question.id) ? colors.accentForeground : colors.mutedForeground} />
              <Text style={[styles.markText, { color: marked.includes(question.id) ? colors.accentForeground : colors.mutedForeground }]}>{marked.includes(question.id) ? "Marked" : "Review later"}</Text>
            </Pressable>
          </View>
          <Text style={[styles.prompt, { color: colors.foreground }]}>{question.prompt}</Text>
          <View style={styles.options}>
            {question.options.map((option, index) => {
              const selected = answers[question.id] === index;
              const letter = String.fromCharCode(65 + index);
              return (
                <Pressable
                  key={`${question.id}-${index}`}
                  onPress={() => setAnswers((prev) => ({ ...prev, [question.id]: index }))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.option, { backgroundColor: selected ? colors.accent : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                >
                  <View style={[styles.optionLetter, { backgroundColor: selected ? colors.primary : colors.secondary }]}>
                    <Text style={[styles.optionLetterText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{letter}</Text>
                  </View>
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
                  {selected ? <Feather name="check-circle" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.questionNav}>
            <Pressable disabled={questionIndex === 0} onPress={() => setQuestionIndex((value) => Math.max(0, value - 1))} style={[styles.navButton, { borderColor: colors.border, opacity: questionIndex === 0 ? 0.45 : 1 }]}>
              <Feather name="arrow-left" size={15} color={colors.foreground} /><Text style={[styles.navLabel, { color: colors.foreground }]}>Previous</Text>
            </Pressable>
            {questionIndex < questionCount - 1 ? (
              <Pressable onPress={() => setQuestionIndex((value) => Math.min(questionCount - 1, value + 1))} style={[styles.navButton, styles.nextButton, { backgroundColor: colors.foreground }]}>
                <Text style={[styles.navLabel, { color: colors.background }]}>Next question</Text><Feather name="arrow-right" size={15} color={colors.background} />
              </Pressable>
            ) : (
              <Pressable disabled={submitting.current} onPress={confirmSubmit} style={[styles.navButton, styles.nextButton, { backgroundColor: colors.primary }]}>
                {submitting.current ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.navLabel, { color: colors.primaryForeground }]}>Submit test</Text>}
                {!submitting.current ? <Feather name="check" size={15} color={colors.primaryForeground} /> : null}
              </Pressable>
            )}
          </View>
          {error ? <Text accessibilityRole="alert" style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          <View style={styles.jumpWrap}>
            <Text style={[styles.jumpTitle, { color: colors.mutedForeground }]}>JUMP TO QUESTION</Text>
            <View style={styles.jumpList}>
              {session.questions.map((item, index) => {
                const answered = answers[item.id] !== null && answers[item.id] !== undefined;
                const active = index === questionIndex;
                return (
                  <Pressable key={item.id} onPress={() => setQuestionIndex(index)} style={[styles.jumpItem, { backgroundColor: active ? colors.foreground : answered ? colors.accent : colors.card, borderColor: active ? colors.foreground : colors.border }]}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: active ? colors.background : answered ? colors.accentForeground : colors.mutedForeground }}>{index + 1}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  exit: { width: 38, height: 38, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  topTitle: { fontSize: 13, fontWeight: "800" },
  topMeta: { fontSize: 10, marginTop: 3 },
  timer: { minWidth: 72, height: 34, borderRadius: 11, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  timerText: { fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] },
  questionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 19 },
  questionCount: { fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  markButton: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 5 },
  markText: { fontSize: 10, fontWeight: "700" },
  prompt: { fontSize: 22, lineHeight: 29, fontWeight: "800", letterSpacing: -0.4, marginTop: 21, marginBottom: 20 },
  options: { gap: 10 },
  option: { minHeight: 57, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 11, gap: 11 },
  optionLetter: { width: 32, height: 32, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  optionLetterText: { fontSize: 12, fontWeight: "800" },
  optionText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  questionNav: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 20 },
  navButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 15, height: 46, borderRadius: 14, borderWidth: 1, minWidth: 114 },
  nextButton: { borderWidth: 0, flex: 1 },
  navLabel: { fontSize: 12, fontWeight: "800" },
  errorBox: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 11, marginTop: 16 },
  errorText: { fontSize: 12, lineHeight: 18 },
  errorLink: { fontSize: 12, fontWeight: "800" },
  jumpWrap: { marginTop: 25 },
  jumpTitle: { fontSize: 9, fontWeight: "800", letterSpacing: 0.9, marginBottom: 10 },
  jumpList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  jumpItem: { width: 33, height: 33, borderRadius: 11, borderWidth: 1, justifyContent: "center", alignItems: "center" },
});