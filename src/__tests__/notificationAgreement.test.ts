import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@apps-in-toss/web-framework', () => ({
  requestNotificationAgreement: vi.fn(),
}));

import { requestNotificationAgreement } from '@apps-in-toss/web-framework';
import { requestWateringNotificationAgreement } from '../lib/notificationAgreement';

afterEach(() => {
  vi.clearAllMocks();
});

describe('requestWateringNotificationAgreement', () => {
  it('환경변수에 설정된 템플릿 코드로 SDK를 호출한다', () => {
    requestWateringNotificationAgreement();
    expect(requestNotificationAgreement).toHaveBeenCalledWith(
      expect.objectContaining({ options: { templateCode: expect.any(String) } }),
    );
  });

  it('onEvent 발생 시 cleanup을 호출해 브릿지 리스너를 해제한다', () => {
    const cleanup = vi.fn();
    vi.mocked(requestNotificationAgreement).mockReturnValue(cleanup);

    requestWateringNotificationAgreement();
    const call = vi.mocked(requestNotificationAgreement).mock.calls[0][0];
    call.onEvent({ type: 'newAgreement' });

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('onError 발생 시에도 cleanup을 호출하고 에러를 로깅한다', () => {
    const cleanup = vi.fn();
    vi.mocked(requestNotificationAgreement).mockReturnValue(cleanup);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    requestWateringNotificationAgreement();
    const call = vi.mocked(requestNotificationAgreement).mock.calls[0][0];
    call.onError(new Error('boom'));

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});
