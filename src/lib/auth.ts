import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

export async function signInAdmin(email: string, password: string) {
  // Önce mevcut oturumu temizleyelim
  await supabase.auth.signOut();

  // Yeni oturum açalım
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Kullanıcı bilgileri alınamadı');
  }

  // Check if user is admin
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', data.user.id)
    .single();

  if (adminError || !adminData) {
    await supabase.auth.signOut();
    throw new Error('Yetkisiz erişim');
  }

  return data;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  return session;
}

export async function checkAdminAccess() {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (adminError || !adminData) {
    return false;
  }

  return true;
} 