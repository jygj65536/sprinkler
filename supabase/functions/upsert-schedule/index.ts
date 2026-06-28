import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { userKey, plantId, plantName, nextWateringDate } = await req.json();
  if (!userKey || !plantId || !plantName || !nextWateringDate) {
    return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
  }

  const { error } = await supabase.from('notification_schedules').upsert(
    {
      user_key: userKey,
      plant_id: plantId,
      plant_name: plantName,
      next_watering_date: nextWateringDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_key,plant_id' },
  );

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
