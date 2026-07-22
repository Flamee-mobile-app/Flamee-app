import { act, renderHook } from '@testing-library/react-native';

import { login, register } from '@/features/auth/services/authService';

import { useLoginForm, useRegisterForm } from './useAuthForm';

const mockSetSession = jest.fn();

jest.mock('@/features/auth/services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
}));

jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { setSession: typeof mockSetSession }) => unknown) =>
    selector({ setSession: mockSetSession }),
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedRegister = register as jest.MockedFunction<typeof register>;

const session = {
  userId: 'demo-user',
  displayName: 'An & Bình',
  email: 'an@example.com',
};

describe('useAuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists a valid login session before calling onSuccess', async () => {
    const events: string[] = [];
    let resolveSession: () => void = () => {};
    const sessionPersisted = new Promise<void>((resolve) => {
      resolveSession = resolve;
    });
    mockedLogin.mockResolvedValue(session);
    mockSetSession.mockImplementation(async () => {
      await sessionPersisted;
      events.push('session');
    });
    const onSuccess = () => events.push('success');
    const { result } = await renderHook(() => useLoginForm(onSuccess));

    await act(async () => {
      result.current.update('email', 'an@example.com');
      result.current.update('password', 'secret1');
    });
    await act(async () => {
      void result.current.submit();
    });

    expect(events).toEqual([]);

    await act(async () => {
      resolveSession();
      await sessionPersisted;
    });

    expect(mockSetSession).toHaveBeenCalledWith(session);
    expect(events).toEqual(['session', 'success']);
  });

  it('persists a valid registration session before calling onSuccess', async () => {
    const events: string[] = [];
    mockedRegister.mockResolvedValue(session);
    mockSetSession.mockImplementation(async () => events.push('session'));
    const onSuccess = () => events.push('success');
    const { result } = await renderHook(() => useRegisterForm(onSuccess));

    await act(async () => {
      result.current.update('phone', '0901234567');
      result.current.update('email', 'an@example.com');
      result.current.update('password', 'secret1');
      result.current.update('acceptedPolicy', true);
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(mockSetSession).toHaveBeenCalledWith(session);
    expect(events).toEqual(['session', 'success']);
  });

  it('keeps the user on the auth route when session persistence fails', async () => {
    mockedLogin.mockResolvedValue(session);
    mockSetSession.mockRejectedValue(new Error('storage unavailable'));
    const onSuccess = jest.fn();
    const { result } = await renderHook(() => useLoginForm(onSuccess));

    await act(async () => {
      result.current.update('email', 'an@example.com');
      result.current.update('password', 'secret1');
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.submitError).toBe('Không thể lưu phiên đăng nhập. Vui lòng thử lại.');
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
