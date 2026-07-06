import { redirect } from 'next/navigation';

export default function ClientFinancesRedirect() {
  redirect('/erp/finances?tab=income');
}
