import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oemhoylcwklpeepkoefz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbWhveWxjd2tscGVlcGtvZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjI5MDEsImV4cCI6MjA5NjEzODkwMX0._Hqzy3Pjq7cDXsO1y1C6f5GfGUvOvjY2lBguj6haxi4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
