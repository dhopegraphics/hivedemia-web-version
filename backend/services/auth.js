import { supabase } from '@/backend/supabase';

/**
 * Handles user signup and profile creation
 * @param {string} email 
 * @param {string} password 
 * @param {string} fullName 
 * @param {string} username 
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
export const signUpWithProfile = async (email, password, fullName, username) => {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });


    if (authError) throw new Error(authError.message || 'Authentication error');
    if (!authData || !authData.user) throw new Error('User not returned from signup');

    const userId = authData.user.id;

    // 2. Create user profile
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
    });

    if (profileError) throw new Error(profileError.message || 'Profile creation failed');

    return { user: authData.user, error: null };
  } catch (error) {
    return { user: null, error: error.message || 'Unknown error occurred' };
  }
};