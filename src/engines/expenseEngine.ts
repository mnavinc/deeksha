export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'selected';

export type ExpenseCategory =
  | 'TRAVEL'
  | 'TRANSPORT'
  | 'FUEL'
  | 'TOLL'
  | 'PARKING'
  | 'ACCOMMODATION'
  | 'FOOD'
  | 'TEMPLE_OFFERING'
  | 'POOJA_MATERIAL'
  | 'MALA'
  | 'IRUMUDI'
  | 'DONATION'
  | 'SHOPPING'
  | 'MEDICAL'
  | 'MISCELLANEOUS';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: string }[] = [
  { id: 'TRAVEL', label: 'Travel', icon: '✈️' },
  { id: 'TRANSPORT', label: 'Transport', icon: '🚌' },
  { id: 'FUEL', label: 'Fuel', icon: '⛽' },
  { id: 'ACCOMMODATION', label: 'Accommodation', icon: '🏨' },
  { id: 'FOOD', label: 'Food', icon: '🍽️' },
  { id: 'TEMPLE_OFFERING', label: 'Temple Offering', icon: '🛕' },
  { id: 'POOJA_MATERIAL', label: 'Pooja Material', icon: '🪔' },
  { id: 'IRUMUDI', label: 'Irumudi', icon: '🎒' },
  { id: 'MALA', label: 'Mala', icon: '📿' },
  { id: 'MEDICAL', label: 'Medical', icon: '🏥' },
  { id: 'MISCELLANEOUS', label: 'Miscellaneous', icon: '📋' },
];

export interface ExpenseParticipant {
  userId: string;
  name: string;
  shareAmount: number;
  settledAmount: number;
}

export interface Expense {
  id: string;
  groupId?: string;
  createdBy: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  payerUserId: string;
  payerName: string;
  splitType: SplitType;
  participants: ExpenseParticipant[];
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank' | 'other';
  settledAt: string;
  status: 'PENDING' | 'SETTLED';
}

export interface MemberBalance {
  userId: string;
  name: string;
  paid: number;
  owed: number;
  net: number;
}

export function calculateBalances(
  expenses: Expense[],
  memberIds: { userId: string; name: string }[]
): MemberBalance[] {
  const balances = new Map<string, MemberBalance>();
  for (const m of memberIds) {
    balances.set(m.userId, { userId: m.userId, name: m.name, paid: 0, owed: 0, net: 0 });
  }

  for (const expense of expenses) {
    const payer = balances.get(expense.payerUserId);
    if (payer) payer.paid += expense.amount;

    for (const p of expense.participants) {
      const member = balances.get(p.userId);
      if (member) member.owed += p.shareAmount;
    }
  }

  for (const b of balances.values()) {
    b.net = b.paid - b.owed;
  }

  return Array.from(balances.values());
}

export interface SettlementSuggestion {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

export function suggestSettlements(balances: MemberBalance[]): SettlementSuggestion[] {
  const debtors = balances.filter((b) => b.net < -0.01).map((b) => ({ ...b, remaining: -b.net }));
  const creditors = balances.filter((b) => b.net > 0.01).map((b) => ({ ...b, remaining: b.net }));
  const suggestions: SettlementSuggestion[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].remaining, creditors[j].remaining);
    if (amount > 0.01) {
      suggestions.push({
        fromUserId: debtors[i].userId,
        fromName: debtors[i].name,
        toUserId: creditors[j].userId,
        toName: creditors[j].name,
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[i].remaining -= amount;
    creditors[j].remaining -= amount;
    if (debtors[i].remaining < 0.01) i++;
    if (creditors[j].remaining < 0.01) j++;
  }

  return suggestions;
}

export function splitEqual(amount: number, count: number): number {
  return Math.round((amount / count) * 100) / 100;
}
