import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hwdgnwngxqttbadvyrox.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_g-s1qDlx0WEEK1wd3mnbrQ_Fw3OoONL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
