import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AYYAPPA_JOURNEY } from '@/data/journeyCheckpoints';
import { colors, spacing } from '@/theme/colors';

interface JourneyPathProps {
  unlockedIds: string[];
  currentDay: number;
}

export function JourneyPath({ unlockedIds, currentDay }: JourneyPathProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.path}>
        {AYYAPPA_JOURNEY.map((cp, index) => {
          const unlocked =
            unlockedIds.includes(cp.id) ||
            (cp.dayUnlock !== undefined && currentDay >= cp.dayUnlock);
          const isCurrent =
            cp.dayUnlock !== undefined && currentDay === cp.dayUnlock;
          return (
            <View key={cp.id} style={styles.nodeWrap}>
              {index > 0 && (
                <View style={[styles.connector, unlocked && styles.connectorActive]} />
              )}
              <View
                style={[
                  styles.node,
                  unlocked && styles.nodeUnlocked,
                  isCurrent && styles.nodeCurrent,
                ]}
              >
                <Text style={styles.nodeIcon}>{unlocked ? cp.icon : '🔒'}</Text>
              </View>
              <Text style={[styles.nodeName, !unlocked && styles.nodeNameLocked]} numberOfLines={2}>
                {cp.name}
              </Text>
              {cp.category === 'TRADITIONAL' && unlocked && (
                <Text style={styles.badge}>Traditional</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -spacing.md },
  path: { flexDirection: 'row', paddingHorizontal: spacing.md, alignItems: 'flex-start' },
  nodeWrap: { alignItems: 'center', width: 80, position: 'relative' },
  connector: {
    position: 'absolute',
    top: 24,
    right: 40,
    width: 80,
    height: 2,
    backgroundColor: colors.border,
    zIndex: 0,
  },
  connectorActive: { backgroundColor: colors.primary },
  node: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeUnlocked: { borderColor: colors.primary, backgroundColor: '#F0B42920' },
  nodeCurrent: { borderColor: colors.success, borderWidth: 3 },
  nodeIcon: { fontSize: 22 },
  nodeName: {
    color: colors.text,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  nodeNameLocked: { color: colors.textDim },
  badge: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 2,
  },
});
