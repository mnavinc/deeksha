import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Expense } from '@/engines/expenseEngine';
import { EXPENSE_CATEGORIES } from '@/engines/expenseEngine';
import { colors, spacing } from '@/theme/colors';

interface ExpenseCardProps {
  expense: Expense;
}

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const cat = EXPENSE_CATEGORIES.find((c) => c.id === expense.category);
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{cat?.icon ?? '📋'}</Text>
      <View style={styles.content}>
        <Text style={styles.desc}>{expense.description}</Text>
        <Text style={styles.meta}>
          {expense.payerName} paid · {expense.expenseDate}
        </Text>
      </View>
      <Text style={styles.amount}>₹{expense.amount.toLocaleString('en-IN')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  icon: { fontSize: 24 },
  content: { flex: 1 },
  desc: { color: colors.text, fontSize: 14, fontWeight: '500' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
