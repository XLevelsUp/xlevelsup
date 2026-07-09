'use server';

import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/auth';
import {
  getClients,
  getClientFinancialSummaries,
  createClient,
  updateClient,
  deleteClient,
} from '@/lib/erp/clients';
import { revalidatePath } from 'next/cache';
import type { Client, ClientFinancialSummary } from '@/types/erp';

const clientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required').max(255),
  phone: z.string().trim().nullable().optional(),
  email: z.string().trim().email('Invalid email address').nullable().optional(),
  address_line1: z.string().trim().nullable().optional(),
  address_line2: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  state: z.string().trim().nullable().optional(),
  pincode: z.string().trim().nullable().optional(),
  gstin: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  services_offered: z.string().trim().nullable().optional(),
});

export interface ClientActionResult {
  success: boolean;
  error?: string;
  client?: Client;
}

function revalidateClientPages() {
  revalidatePath('/erp/clients');
  revalidatePath('/erp/finances');
  revalidatePath('/erp/pos');
}

function fieldFromFormData(formData: FormData, key: string): string | null {
  const value = (formData.get(key) as string) || '';
  return value.trim() || null;
}

export async function getClientsAction(): Promise<Client[]> {
  try {
    await requireAuth();
    return await getClients();
  } catch (error) {
    console.error('Get clients error:', error);
    return [];
  }
}

export async function getClientSummariesAction(): Promise<Record<string, ClientFinancialSummary>> {
  try {
    await requireAuth();
    return await getClientFinancialSummaries();
  } catch (error) {
    console.error('Get client summaries error:', error);
    return {};
  }
}

export async function createClientAction(formData: FormData): Promise<ClientActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    const rawData = {
      name: (formData.get('name') as string) || '',
      phone: fieldFromFormData(formData, 'phone'),
      email: fieldFromFormData(formData, 'email'),
      address_line1: fieldFromFormData(formData, 'address_line1'),
      address_line2: fieldFromFormData(formData, 'address_line2'),
      city: fieldFromFormData(formData, 'city'),
      state: fieldFromFormData(formData, 'state'),
      pincode: fieldFromFormData(formData, 'pincode'),
      gstin: fieldFromFormData(formData, 'gstin'),
      notes: fieldFromFormData(formData, 'notes'),
      services_offered: fieldFromFormData(formData, 'services_offered'),
    };

    const validated = clientSchema.parse(rawData);
    const client = await createClient(validated);

    revalidateClientPages();
    return { success: true, client };
  } catch (error) {
    console.error('Create client error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client',
    };
  }
}

export async function updateClientAction(
  id: number,
  formData: FormData,
): Promise<ClientActionResult> {
  try {
    await requireRole(['admin', 'hr']);

    const rawData = {
      name: (formData.get('name') as string) || '',
      phone: fieldFromFormData(formData, 'phone'),
      email: fieldFromFormData(formData, 'email'),
      address_line1: fieldFromFormData(formData, 'address_line1'),
      address_line2: fieldFromFormData(formData, 'address_line2'),
      city: fieldFromFormData(formData, 'city'),
      state: fieldFromFormData(formData, 'state'),
      pincode: fieldFromFormData(formData, 'pincode'),
      gstin: fieldFromFormData(formData, 'gstin'),
      notes: fieldFromFormData(formData, 'notes'),
      services_offered: fieldFromFormData(formData, 'services_offered'),
    };

    const validated = clientSchema.parse(rawData);
    const client = await updateClient(id, validated);

    revalidateClientPages();
    return { success: true, client };
  } catch (error) {
    console.error('Update client error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update client',
    };
  }
}

export async function deleteClientAction(id: number): Promise<ClientActionResult> {
  try {
    await requireRole(['admin']);
    await deleteClient(id);
    revalidateClientPages();
    return { success: true };
  } catch (error) {
    console.error('Delete client error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete client',
    };
  }
}
