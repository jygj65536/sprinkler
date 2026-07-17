// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  getPermission: vi.fn(),
  openPermissionDialog: vi.fn(),
}));

vi.mock('@apps-in-toss/web-framework', () => {
  const getCurrentLocation = vi.fn() as unknown as {
    (): Promise<never>;
    getPermission: typeof mocks.getPermission;
    openPermissionDialog: typeof mocks.openPermissionDialog;
  };
  getCurrentLocation.getPermission = mocks.getPermission;
  getCurrentLocation.openPermissionDialog = mocks.openPermissionDialog;
  return {
    Storage: { getItem: vi.fn().mockResolvedValue(null), setItem: vi.fn().mockResolvedValue(undefined) },
    getCurrentLocation,
    Accuracy: { Balanced: 3 },
  };
});

import { useWeather } from '../hooks/useWeather';

describe('useWeather.requestPermission — iOS 재거부 시 무반응 버그', () => {
  beforeEach(() => {
    mocks.getPermission.mockReset();
    mocks.openPermissionDialog.mockReset();
  });

  it('이미 거부된 상태(denied)라면 시스템 다이얼로그를 다시 띄우지 않고 콜백으로 안내한다', async () => {
    mocks.getPermission.mockResolvedValue('denied');

    const { result } = renderHook(() => useWeather());
    await waitFor(() => expect(result.current.permission).toBe('denied'));

    const onStillDenied = vi.fn();
    await act(async () => {
      await result.current.requestPermission(onStillDenied);
    });

    // iOS는 denied 상태에서 openPermissionDialog를 호출해도 UI가 뜨지 않으므로 아예 호출하지 않아야 한다
    expect(mocks.openPermissionDialog).not.toHaveBeenCalled();
    expect(onStillDenied).toHaveBeenCalledTimes(1);
    expect(result.current.permission).toBe('denied');
  });

  it('notDetermined 상태에서 다이얼로그를 띄웠지만 여전히 거부되면 콜백으로 안내한다', async () => {
    mocks.getPermission
      .mockResolvedValueOnce('notDetermined') // 마운트 시 최초 조회
      .mockResolvedValueOnce('notDetermined') // requestPermission 진입 시 확인
      .mockResolvedValueOnce('denied');       // 다이얼로그 이후 재확인
    mocks.openPermissionDialog.mockResolvedValue('denied');

    const { result } = renderHook(() => useWeather());
    await waitFor(() => expect(result.current.permission).toBe('unknown'));

    const onStillDenied = vi.fn();
    await act(async () => {
      await result.current.requestPermission(onStillDenied);
    });

    expect(mocks.openPermissionDialog).toHaveBeenCalledTimes(1);
    expect(onStillDenied).toHaveBeenCalledTimes(1);
    expect(result.current.permission).toBe('denied');
  });

  it('다이얼로그에서 허용하면 콜백이 호출되지 않는다', async () => {
    mocks.getPermission
      .mockResolvedValueOnce('notDetermined')
      .mockResolvedValueOnce('notDetermined')
      .mockResolvedValueOnce('allowed');
    mocks.openPermissionDialog.mockResolvedValue('allowed');

    const { result } = renderHook(() => useWeather());
    await waitFor(() => expect(result.current.permission).toBe('unknown'));

    const onStillDenied = vi.fn();
    await act(async () => {
      await result.current.requestPermission(onStillDenied);
    });

    expect(onStillDenied).not.toHaveBeenCalled();
  });
});
