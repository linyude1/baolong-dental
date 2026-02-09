import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('缺少Supabase配置，请检查.env文件中的SUPABASE_URL和SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
