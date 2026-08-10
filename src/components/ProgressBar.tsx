import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/colors';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: string;
}

export function ProgressBar({ progress, label, color = colors.primary }: ProgressBarProps) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.pct}>{Math.round(pct)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { color: colors.textMuted, fontSize: 12 },
  track: {
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  pct: { color: colors.textMuted, fontSize: 11, textAlign: 'right' },
});
