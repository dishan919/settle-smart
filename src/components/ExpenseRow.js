import React from 'react';
import { router } from 'expo-router';
import { Row } from './UI';
import { formatMoney } from '../utils/money';
const icons = {
  Food: 'restaurant-outline',
  Transport: 'car-outline',
  Accommodation: 'bed-outline',
  Shopping: 'bag-outline',
  Entertainment: 'ticket-outline',
  Bills: 'document-text-outline',
  Other: 'receipt-outline',
};
export default function ExpenseRow({ expense }) {
  return (
    <Row
      title={expense.description}
      subtitle={`${expense.group_name || expense.category} · ${expense.date}`}
      right={formatMoney(expense.amount, expense.currency)}
      icon={icons[expense.category]}
      onPress={() =>
        router.push({ pathname: '/expenses/[id]', params: { id: expense.id } })
      }
    />
  );
}
