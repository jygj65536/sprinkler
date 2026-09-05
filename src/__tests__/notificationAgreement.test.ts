import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@apps-in-toss/web-framework', () => ({
  requestNotificationAgreement: vi.fn(),
}));

import { requestNotificationAgreement } from '@apps-in-toss/web-framework';
import { requestWateringNotificationAgreement } from '../lib/notificationAgreement';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requestWateringNotificationAgreement', () => {
  it('환경변수에 설정된 템플릿 코드로 SDK를 호출한다', () => {
    requestWateringNotificationAgreement();
    expect(requestNotificationAgreement).toHaveBeenCalledWith(
      expect.objectContaining({ options: { templateCode: expect.any(String) } }),
    );
  });

  it('onEvent/onError 콜백을 전달한다', () => {
    requestWateringNotificationAgreement();
    const call = vi.mocked(requestNotificationAgreement).mock.calls[0][0];
    expect(typeof call.onEvent).toBe('function');
    expect(typeof call.onError).toBe('function');
  });
});
