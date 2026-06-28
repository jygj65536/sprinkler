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

// mTLS 인증서는 Supabase Secret으로 주입
// AIT_MTLS_CERT, AIT_MTLS_KEY 환경변수에 PEM 문자열로 저장
async function sendMessage(userKey: string, plantName: string): Promise<void> {
  const cert = Deno.env.get('AIT_MTLS_CERT');
  const key = Deno.env.get('AIT_MTLS_KEY');

  // mTLS가 설정된 경우 Deno.connectTls로 처리, 없으면 일반 fetch (개발용)
  if (cert && key) {
    // TODO: Deno mTLS 지원 확정 후 구현
    // 현재는 fetch로 호출 (운영 환경에서는 mTLS 필수)
    console.warn('mTLS 미적용 — 운영 전 설정 필요');
  }

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
    },
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
