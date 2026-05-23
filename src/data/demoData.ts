import type { AppData } from '../types';

const sixMonths = new Date();
sixMonths.setMonth(sixMonths.getMonth() + 6);
const twelveMonths = new Date();
twelveMonths.setMonth(twelveMonths.getMonth() + 12);
const eighteenMonths = new Date();
eighteenMonths.setMonth(eighteenMonths.getMonth() + 18);

export const demoData: AppData = {
  income: [
    { id: 'inc1', name: 'Salary', amount: 5200, frequency: 'monthly' },
    { id: 'inc2', name: 'Freelance', amount: 400, frequency: 'monthly' },
  ],
  expenses: [
    { id: 'exp1', name: 'Rent', amount: 1650, category: 'Housing', isFixed: true },
    { id: 'exp2', name: 'Car Payment', amount: 380, category: 'Transportation', isFixed: true },
    { id: 'exp3', name: 'Groceries', amount: 520, category: 'Food', isFixed: false },
    { id: 'exp4', name: 'Utilities', amount: 145, category: 'Utilities', isFixed: true },
    { id: 'exp5', name: 'Phone & Internet', amount: 95, category: 'Subscriptions', isFixed: true },
    { id: 'exp6', name: 'Health Insurance', amount: 210, category: 'Healthcare', isFixed: true },
    { id: 'exp7', name: 'Dining Out', amount: 280, category: 'Food', isFixed: false },
    { id: 'exp8', name: 'Streaming', amount: 45, category: 'Subscriptions', isFixed: true },
    { id: 'exp9', name: 'Gas', amount: 120, category: 'Transportation', isFixed: false },
    { id: 'exp10', name: 'Personal Care', amount: 75, category: 'Personal', isFixed: false },
  ],
  debts: [
    {
      id: 'debt1',
      name: 'Credit Card',
      balance: 4800,
      interestRate: 22.9,
      minimumPayment: 120,
      extraPayment: 50,
    },
    {
      id: 'debt2',
      name: 'Student Loan',
      balance: 18500,
      interestRate: 5.5,
      minimumPayment: 210,
      extraPayment: 0,
    },
    {
      id: 'debt3',
      name: 'Car Loan',
      balance: 9200,
      interestRate: 6.2,
      minimumPayment: 285,
      extraPayment: 0,
    },
  ],
  emergencyFund: {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    targetAmount: 15000,
    currentAmount: 4200,
    monthlyContribution: 300,
  },
  savingsGoals: [
    {
      id: 'save2',
      name: 'Vacation',
      targetAmount: 3000,
      currentAmount: 800,
      targetDate: twelveMonths.toISOString().split('T')[0],
      monthlyContribution: 200,
    },
    {
      id: 'save3',
      name: 'New Laptop',
      targetAmount: 1500,
      currentAmount: 350,
      targetDate: sixMonths.toISOString().split('T')[0],
      monthlyContribution: 200,
    },
  ],
};
