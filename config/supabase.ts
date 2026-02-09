import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('缺少Supabase配置，请检查.env.local文件');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
