jest.mock('@nestjs/swagger', () => ({
  ApiProperty: () => () => undefined,
  ApiPropertyOptional: () => () => undefined,
}));

import { AuthController } from '../../src/auth/auth.controller';

describe('AuthController session cookies', () => {
  const user = { id: 3, name: 'User', email: 'user@example.com', role: 'LEADER' };

  function createController() {
    const auth = {
      login: jest.fn().mockResolvedValue({ accessToken: 'signed-token', user }),
    };
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    };
    return {
      controller: new AuthController(auth as any),
      auth,
      response,
    };
  }

  it('sets the 60-day HTTP-only cookie after password login', async () => {
    const { controller, response } = createController();

    await controller.login({ user }, response as any);

    expect(response.cookie).toHaveBeenCalledWith('accessToken', 'signed-token', expect.objectContaining({
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000,
    }));
  });

  it('renews the session cookie through refresh', async () => {
    const { controller, response } = createController();

    await controller.refresh({ user }, response as any);

    expect(response.cookie).toHaveBeenCalledWith('accessToken', 'signed-token', expect.any(Object));
  });

  it('clears the cookie with the same security attributes on logout', async () => {
    const { controller, response } = createController();

    await controller.logout(response as any);

    expect(response.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({
      httpOnly: true,
      sameSite: 'lax',
    }));
  });
});
