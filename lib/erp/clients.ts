/**
 * Data layer for Clients (Supabase)
 */

import { supabaseServer as supabase } from '@/lib/supabase-server';
import type { Client } from '@/types/erp';


/**
 * Get all clients ordered by name
 */
export async function getClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    // Fallback if the table does not exist or isn't migrated yet
    if (error) {
      console.warn('Clients table fetch failed, returning empty list:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error fetching clients:', err);
    return [];
  }
}
