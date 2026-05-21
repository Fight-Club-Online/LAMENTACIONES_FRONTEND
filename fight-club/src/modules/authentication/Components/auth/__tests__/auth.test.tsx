import type { FormEvent } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockHandleSubmit = vi.fn((event: FormEvent) => event.preventDefault());
const mockUseLogin = vi.fn();
const mockAuthPost = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../Hooks/useLogin', () => ({
  useLogin: () => mockUseLogin(),
}));

vi.mock('../../../Config/axios', () => ({
  default: {
    post: (...args: unknown[]) => mockAuthPost(...args),
  },
}));

import { AuthHeader } from '../AuthHeader';
import { LoginForm } from '../LoginForm';
import { SocialAuth } from '../SocialAuth';
import { SuccessCard } from '../SuccessCard';

describe('authentication auth components', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockHandleSubmit.mockClear();
    mockAuthPost.mockReset();
    mockAuthPost.mockResolvedValue({
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        userId: 'user-1',
        username: 'fighter',
        email: 'fighter@example.com',
        role: 'PLAYER',
      },
    });
    mockUseLogin.mockReturnValue({
      email: 'fighter@example.com',
      setEmail: vi.fn(),
      password: 'secret123',
      setPassword: vi.fn(),
      isLoading: false,
      isSuccess: false,
      profileRoute: '/perfil',
      error: null,
      handleSubmit: mockHandleSubmit,
    });
  });

  it('renders the auth header branding', () => {
    render(<AuthHeader />);

    expect(screen.getByText('FIGHT')).toBeInTheDocument();
    expect(screen.getByText('CLUB')).toBeInTheDocument();
    expect(screen.getByText('Online Battle')).toBeInTheDocument();
  });

  it('toggles password visibility and submits the login form', () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /entrar al combate/i }));
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it('executes the google social login flow', async () => {
    render(
      <MemoryRouter>
        <SocialAuth />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('google-login'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/lobby');
    });
  });

  it('confirms the success card action', () => {
    render(<SuccessCard onConfirm={() => mockNavigate('/perfil')} />);

    fireEvent.click(screen.getByRole('button', { name: /entrar al arena/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  });
});