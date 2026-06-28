import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { userKey, plantId } = await req.json();
  if (!userKey || !plantId) {
    return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
  }

  const { error } = await supabase
    .from('notification_schedules')
    .delete()
    .eq('user_key', userKey)
    .eq('plant_id', plantId);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
