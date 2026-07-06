import { redirect } from 'next/navigation';

export default function ExpensesRedirect() {
  redirect('/erp/finances?tab=expenses');
}
