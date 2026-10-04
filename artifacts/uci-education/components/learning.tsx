import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export function Page({ children }: React.PropsWithChildren) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "web" ? 67 : insets.top + 8,
        paddingBottom: Platform.OS === "web" ? 118 : Math.max(112, insets.bottom + 104),
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
    >
      {children}
    </ScrollView>
  );
}

export function BrandHeader({
  greeting,
  name,
  onProfile,
}: {
  greeting?: string;
  name?: string;
  onProfile?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={[styles.brandMark, { backgroundColor: colors.foreground }]}>
        <Ionicons name="book-outline" size={19} color={colors.primaryForeground} />
      </View>
      <View style={{ flex: 1 }}>
        {greeting ? (
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
        ) : null}
        <Text style={[styles.brand, { color: colors.foreground }]}>
          UCI<Text style={{ color: colors.primary }}>.</Text>
        </Text>
        {name ? <Text style={[styles.subGreeting, { color: colors.foreground }]}>{name}</Text> : null}
      </View>
      {onProfile ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          testID="home-profile-button"
          onPress={onProfile}
          style={[styles.profileButton, { backgroundColor: colors.secondary }]}
        >
          <Feather name="user" size={19} color={colors.foreground} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={[styles.actionText, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Panel({ children, style }: React.PropsWithChildren<{ style?: object }>) {
  const colors = useColors();
  return (
    <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function LoadingState({ label = "Loading your learning space…" }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ onRetry, label = "We couldn’t load this right now." }: { onRetry: () => void; label?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="wifi-off" size={21} color={colors.mutedForeground} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>{label}</Text>
      <Pressable onPress={onRetry} style={[styles.retry, { backgroundColor: colors.primary }]}>
        <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="book-open" size={20} color={colors.primary} />
      </View>
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>{description}</Text>
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const colors = useColors();
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
      <View style={[styles.progressFill, { width: `${safeValue}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { fontSize: 12, fontWeight: "600", marginBottom: 1 },
  brand: { fontSize: 19, fontWeight: "800", letterSpacing: 0.4 },
  subGreeting: { fontSize: 13, fontWeight: "600", marginTop: 1 },
  profileButton: { width: 42, height: 42, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  sectionTitle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 24 },
  sectionHeading: { fontSize: 19, fontWeight: "700", letterSpacing: -0.3 },
  actionText: { fontSize: 13, fontWeight: "700" },
  panel: { borderRadius: 22, borderWidth: 1, padding: 16 },
  state: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 12 },
  stateText: { fontSize: 14 },
  stateCard: { alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 20, padding: 24, marginTop: 12 },
  stateTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  retry: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: 14, marginTop: 2 },
  empty: { alignItems: "center", gap: 9, borderWidth: 1, borderRadius: 20, padding: 24 },
  emptyIcon: { width: 42, height: 42, borderRadius: 15, justifyContent: "center", alignItems: "center", marginBottom: 3 },
  emptyCopy: { fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 260 },
  progressTrack: { height: 7, borderRadius: 9, overflow: "hidden" },
  progressFill: { height: 7, borderRadius: 9 },
});