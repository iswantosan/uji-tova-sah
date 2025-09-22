import { supabase } from "@/integrations/supabase/client";

export const grantAdminRole = async (userEmail: string) => {
  try {
    // First, get the user ID from the email
    const { data: user, error: userError } = await (supabase as any)
      .from('auth.users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return { error: 'User not found' };
    }

    // Insert admin role for the user
    const { error } = await (supabase as any)
      .from('user_roles')
      .insert({ 
        user_id: user.id, 
        role: 'admin' 
      });

    if (error) {
      console.error('Error granting admin role:', error);
      return { error: 'Failed to grant admin role' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in grantAdminRole:', error);
    return { error: 'An unexpected error occurred' };
  }
};

export const checkAdminStatus = async () => {
  try {
    const { data, error } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('role', 'admin')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkAdminStatus:', error);
    return false;
  }
};