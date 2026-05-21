import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarSelector } from '../AvatarSelector'
import { FormInput } from '../FormInput'
import { GuestForm } from '../GuestForm'
import { RegisterForm } from '../RegisterForm'
import { useRegister } from '../../../Hooks/useRegister'
import authApi from '../../../Config/axios'

const navigateMock = vi.fn()
const mockedUseRegister = vi.mocked(useRegister)
const mockedAuthApi = vi.mocked(authApi)

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../../Hooks/useRegister', () => ({
  useRegister: vi.fn(),
}))

vi.mock('../../../Config/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('Register components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('toggles password visibility in the form input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const { container } = render(
      <FormInput
        label="Contraseña"
        icon={() => <span />}
        type="password"
        placeholder="••••••••"
        onChange={onChange}
      />
    )

    const input = screen.getByPlaceholderText('••••••••')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(container.querySelector('button[type="button"]') as HTMLButtonElement)
    expect(input).toHaveAttribute('type', 'text')
  })

  it('selects preset avatars and triggers file upload', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onFileClick = vi.fn()

    const { container } = render(
      <AvatarSelector
        selected="👊"
        onSelect={onSelect}
        onFileClick={onFileClick}
        presets={['👊', '🥷']}
      />
    )

    const buttons = Array.from(container.querySelectorAll('button'))
    await user.click(buttons[1])
    await user.click(buttons[2])

    expect(onSelect).toHaveBeenCalledWith('🥷')
    expect(onFileClick).toHaveBeenCalledTimes(1)
  })

  it('creates a guest account and stores auth data', async () => {
    const user = userEvent.setup()

    mockedAuthApi.post.mockResolvedValueOnce({
      data: {
        accessToken: 'guest-token',
        refreshToken: 'guest-refresh',
        userId: 'guest-1',
        username: 'Visitor',
      },
    })

    render(<GuestForm />)

    await user.type(screen.getByPlaceholderText('Nombre temporal de combate'), 'Visitor')
    await user.click(screen.getByRole('button', { name: /entrar como invitado/i }))

    await waitFor(() => {
      expect(mockedAuthApi.post).toHaveBeenCalledWith('/api/v1/users/guest', { username: 'Visitor' })
      expect(navigateMock).toHaveBeenCalledWith('/lobby')
    })

    expect(localStorage.getItem('fight_club_token')).toBe('guest-token')
    expect(localStorage.getItem('user_data')).toContain('guest-1')
  })

  it('validates passwords before submitting the register form', async () => {
    const user = userEvent.setup()
    const register = vi.fn()
    const setError = vi.fn()

    mockedUseRegister.mockReturnValue({
      register,
      isLoading: false,
      isSuccess: false,
      profileRoute: '/perfil',
      error: null,
      setError,
    })

    const { container } = render(<RegisterForm />)

    await user.type(within(container).getAllByPlaceholderText('••••••••')[0], 'secret12')
    await user.type(within(container).getAllByPlaceholderText('••••••••')[1], 'secret34')

    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    expect(setError).toHaveBeenCalledWith('Las contraseñas no coinciden, combatiente.')
    expect(register).not.toHaveBeenCalled()
  })

  it('submits the register payload when the form is valid', async () => {
    const user = userEvent.setup()
    const register = vi.fn().mockResolvedValue(undefined)
    const setError = vi.fn()

    mockedUseRegister.mockReturnValue({
      register,
      isLoading: false,
      isSuccess: false,
      profileRoute: '/perfil',
      error: null,
      setError,
    })

    const { container } = render(<RegisterForm />)

    await user.type(within(container).getByPlaceholderText('Tu nombre de guerra'), 'Neo')
    await user.type(within(container).getByPlaceholderText('combate@ejemplo.com'), 'neo@example.com')
    await user.type(within(container).getAllByPlaceholderText('••••••••')[0], 'secret123')
    await user.type(within(container).getAllByPlaceholderText('••••••••')[1], 'secret123')
    fireEvent.submit(container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'Neo',
          email: 'neo@example.com',
          password: 'secret123',
          avatarURL: '👊',
        })
      )
    })
  })
})