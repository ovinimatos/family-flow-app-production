import { createClient } from '@supabase/supabase-js';

// Correção: Colocamos os valores entre aspas simples e removemos o "process.env"
const supabaseUrl = 'https://zvjpdullthzdcfwwcjmd.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2anBkdWxsdGh6ZGNmd3djam1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzUzOTIsImV4cCI6MjA4MDExMTM5Mn0.qE5PBBqtXV3mg6OsUpgKa4BvQ6KaHyQvBjuLGG0AeG0';

// Cria a conexão oficial
export const supabase = createClient(supabaseUrl, supabaseAnonKey);