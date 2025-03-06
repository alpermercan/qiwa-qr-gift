import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createAdmin() {
  const email = 'admin@qiwa.co';
  const password = 'QiwaAdmin2024!';

  try {
    // Önce mevcut admin hesabını silelim
    await supabase
      .from('admins')
      .delete()
      .eq('email', email);

    console.log('Existing admin record deleted');

    // Mevcut auth kullanıcısını silelim
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users.users.find(user => user.email === email);
    
    if (existingUser) {
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('Existing auth user deleted');
    }

    // Önce Supabase Auth'da kullanıcı oluşturalım
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return;
    }

    console.log('Auth user created successfully');

    // Şimdi admin tablosuna kayıt ekleyelim
    const hashedPassword = await hash(password, 10);
    
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          user_id: authData.user.id
        },
      ])
      .select()
      .single();

    if (adminError) {
      console.error('Error creating admin record:', adminError.message);
      // Hata durumunda auth kullanıcısını da silelim
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('Admin created successfully:', adminData);
    console.log('\nYeni admin bilgileri:');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin(); 