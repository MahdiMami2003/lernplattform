import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';

// Helper: ensure requester is admin
async function assertAdmin(event: any) {
  const session = await event.locals.getSession?.();
  if (!session?.user?.id) {
    return { ok: false, status: 401, message: 'Not authenticated' };
  }
  const { data: prof } = await event.locals.supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (prof?.role !== 'admin') {
    return { ok: false, status: 403, message: 'Forbidden' };
  }
  return { ok: true, session };
}

// GET /api/admin/users/:id -> returns auth email for user id
export const GET: RequestHandler = async ({ params, locals }) => {
  const adminCheck = await assertAdmin({ locals });
  if (!adminCheck.ok) {
    return new Response(JSON.stringify({ error: adminCheck.message }), { status: adminCheck.status });
  }
  const userId = params.id;
  if (!userId) return new Response(JSON.stringify({ error: 'Missing user id' }), { status: 400 });

  const serviceClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await serviceClient.auth.admin.getUserById(userId);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const email = data?.user?.email ?? null;
  return new Response(JSON.stringify({ email }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

// DELETE /api/admin/users/:id -> delete user from auth and profiles (non-admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const adminCheck = await assertAdmin({ locals });
  if (!adminCheck.ok) {
    return new Response(JSON.stringify({ error: adminCheck.message }), { status: adminCheck.status });
  }
  const targetId = params.id;
  if (!targetId) return new Response(JSON.stringify({ error: 'Missing user id' }), { status: 400 });

  // Check target role; block if admin
  const { data: targetProfile, error: targetErr } = await locals.supabase
    .from('profiles')
    .select('role')
    .eq('id', targetId)
    .single();
  if (targetErr) {
    return new Response(JSON.stringify({ error: targetErr.message }), { status: 500 });
  }
  if (targetProfile?.role === 'admin') {
    return new Response(JSON.stringify({ error: 'Cannot delete admin users' }), { status: 403 });
  }

  // Delete from profiles first
  const { error: delProfileErr } = await locals.supabase
    .from('profiles')
    .delete()
    .eq('id', targetId);
  if (delProfileErr) {
    return new Response(JSON.stringify({ error: delProfileErr.message }), { status: 500 });
  }

  // Delete from auth using service role
  const serviceClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error: delAuthErr } = await serviceClient.auth.admin.deleteUser(targetId);
  if (delAuthErr) {
    return new Response(JSON.stringify({ error: delAuthErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

