import type { ChangeEvent, FormEvent } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockRegister = vi.fn();
const mockSetError = vi.fn();
const mockUseRegister = vi.fn();
const mockAuthPost = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../Hooks/useRegister', () => ({
  useRegister: () => mockUseRegister(),
}));

vi.mock('../../../Config/axios', () => ({
  default: {
    post: (...args: unknown[]) => mockAuthPost(...args),
  },
}));

import { AvatarSelector } from '../AvatarSelector';
import { FormInput } from '../FormInput';
import { GuestForm } from '../GuestForm';
import { RegisterForm } from '../RegisterForm';
import { User } from 'lucide-react';

describe('authentication register components', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockRegister.mockReset();
    mockSetError.mockReset();
    mockAuthPost.mockReset();
    mockAuthPost.mockResolvedValue({
      data: {
        accessToken: 'guest-token',
        refreshToken: 'guest-refresh',
        userId: 'guest-1',
        username: 'Guest Fighter',
      },
    });
    mockUseRegister.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      isSuccess: false,
      profileRoute: '/perfil',
      error: null,
      setError: mockSetError,
    });
    localStorage.clear();
  });

  it('selects presets and triggers file selection in AvatarSelector', () => {
    const onSelect = vi.fn();
    const onFileClick = vi.fn();

    render(
      <AvatarSelector
        selected="👊"
        presets={['👊', '🥷']}
        onSelect={onSelect}
        onFileClick={onFileClick}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '🥷' }));
    fireEvent.click(screen.getByRole('button', { name: '' }));

    expect(onSelect).toHaveBeenCalledWith('🥷');
    expect(onFileClick).toHaveBeenCalledTimes(1);
  });

  it('toggles password visibility in FormInput', () => {
    const onChange = vi.fn();

    render(
      <FormInput
        label="Contraseña"
        icon={User}
        type="password"
        placeholder="••••••••"
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText('••••••••');
    expect(input).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button'));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('rejects mismatched passwords in RegisterForm', () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Tu nombre de guerra'), {
      target: { value: 'Campeon' },
    });
    fireEvent.change(screen.getByPlaceholderText('combate@ejemplo.com'), {
      target: { value: 'campeon@example.com' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], {
      target: { value: 'secret456' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: '' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /unirse al combate/i }));

    expect(mockSetError).toHaveBeenCalledWith('Las contraseñas no coinciden, combatiente.');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('submits the registration payload when passwords match', () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Tu nombre de guerra'), {
      target: { value: 'Campeon' },
    });
    fireEvent.change(screen.getByPlaceholderText('combate@ejemplo.com'), {
      target: { value: 'campeon@example.com' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[0], {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('••••••••')[1], {
      target: { value: 'secret123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /unirse al combate/i }));

    expect(mockRegister).toHaveBeenCalledWith({
      username: 'Campeon',
      email: 'campeon@example.com',
      password: 'secret123',
      avatarURL: '👊',
    });
  });

  it('creates a guest account and stores the session data', async () => {
    render(
      <MemoryRouter>
        <GuestForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre temporal de combate'), {
      target: { value: 'Invitado' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar como invitado/i }));

    await waitFor(() => {
      expect(mockAuthPost).toHaveBeenCalledWith('/api/v1/users/guest', { username: 'Invitado' });
      expect(localStorage.getItem('fight_club_token')).toBe('guest-token');
      expect(mockNavigate).toHaveBeenCalledWith('/lobby');
    });
  });
});