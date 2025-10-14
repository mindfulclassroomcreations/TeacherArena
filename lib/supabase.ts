import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProductIdea {
  id?: string;
  product_title: string;
  grade_level: string;
  standards: string;
  notes: string;
  category?: string;
  created_at?: string;
}
