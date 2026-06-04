import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oemhoylcwklpeepkoefz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbWhveWxjd2tscGVlcGtvZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjI5MDEsImV4cCI6MjA5NjEzODkwMX0._Hqzy3Pjq7cDXsO1y1C6f5GfGUvOvjY2lBguj6haxi4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function showUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('List of users in Supabase:');
    data.forEach(u => {
      console.log(`ID: ${u.id} | Username: ${u.username} | Name: ${u.name} | Role: ${u.rol} | Consent: ${u.consent}`);
    });
  }
}

showUsers();
