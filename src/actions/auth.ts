'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAuthSupabase } from '@/lib/supabase/server';

export async function signIn(_prev: unknown, formData: FormData) {
  const supabase = await createAuthSupabase();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Correo y contraseña son requeridos' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  redirect('/');
}

export async function signOut() {
  const supabase = await createAuthSupabase();
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/login');
}
