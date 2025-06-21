import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Use your Supabase service role key (keep this secret!)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function deleteUserHandler(req: Request, res: Response) {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
