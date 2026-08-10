import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAvatarStage } from '@/data/achievements';
import { getSwamiTier } from '@/data/swamiNames';
import { colors, spacing } from '@/theme/colors';

interface AvatarDisplayProps {
  points: number;
  pilgrimageCount: number;
  name: string;
}

export function AvatarDisplay({ points, pilgrimageCount, name }: AvatarDisplayProps) {
  const stage = getAvatarStage(points);
  const tier = getSwamiTier(Math.max(pilgrimageCount, 1));

  return (
    <View style={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.emoji}>{stage.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>Swami {name}</Text>
        <Text style={styles.tier}>
          {tier.symbol} {tier.traditionalName}
        </Text>
        <Text style={styles.stage}>
          {stage.label} · {points} pts
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emoji: { fontSize: 32 },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  tier: { color: colors.primary, fontSize: 14, marginTop: 2 },
  stage: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
