import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const AIT_API_BASE = 'https://apps-in-toss-api.toss.im';
const TEMPLATE_SET_CODE = Deno.env.get('AIT_TEMPLATE_SET_CODE')!;

// KST = UTC+9. cron은 UTC 00:00에 실행 → KST 09:00
function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function createHttpClient() {
  const cert = Deno.env.get('AIT_MTLS_CERT');
  const key = Deno.env.get('AIT_MTLS_KEY');
  if (cert && key) {
    return Deno.createHttpClient({ certChain: cert, privateKey: key });
  }
  return undefined;
}

const httpClient = createHttpClient();

async function sendMessage(userKey: string, plantName: string): Promise<void> {
  await fetch(
    `${AIT_API_BASE}/api-partner/v1/apps-in-toss/messenger/send-message`,
    {
      method: 'POST',
      headers: {
        'x-toss-user-key': userKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateSetCode: TEMPLATE_SET_CODE,
        context: { plantName },
      }),
      client: httpClient,
    } as RequestInit & { client?: Deno.HttpClient },
  );
}

Deno.serve(async () => {
  const today = todayKST();

  const { data: schedules, error } = await supabase
    .from('notification_schedules')
    .select('user_key, plant_name')
    .eq('next_watering_date', today);

  if (error) {
    console.error('스케줄 조회 실패:', error.message);
    return new Response('error', { status: 500 });
  }

  const results = await Promise.allSettled(
    (schedules ?? []).map(s => sendMessage(s.user_key, s.plant_name)),
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  console.log(`발송 완료: ${results.length - failed}건 성공, ${failed}건 실패`);

  return new Response(JSON.stringify({ sent: results.length, failed }), { status: 200 });
});
