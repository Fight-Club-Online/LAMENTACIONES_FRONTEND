import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthHeader } from '../AuthHeader'
import { LoginForm } from '../LoginForm'
import { SocialAuth } from '../SocialAuth'
import { SuccessCard } from '../SuccessCard'
import { useLogin } from '../../../Hooks/useLogin'
import authApi from '../../../Config/axios'

const navigateMock = vi.fn()
const mockedUseLogin = vi.mocked(useLogin)
const mockedAuthApi = vi.mocked(authApi)

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../../Hooks/useLogin', () => ({
  useLogin: vi.fn(),
}))

vi.mock('../../../Config/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('Authentication components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders the auth header', () => {
    render(<AuthHeader />)

    expect(screen.getByRole('heading', { name: /fight club/i })).toBeInTheDocument()
    expect(screen.getByText(/online battle/i)).toBeInTheDocument()
  })

  it('confirms success card actions', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(<SuccessCard onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: /entrar al arena/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('toggles password visibility and submits the login form', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn((event) => event.preventDefault())
    const setEmail = vi.fn()
    const setPassword = vi.fn()

    mockedUseLogin.mockReturnValue({
      email: 'combatiente@eci.edu.co',
      setEmail,
      password: 'secret123',
      setPassword,
      isLoading: false,
      isSuccess: false,
      profileRoute: '/perfil',
      error: null,
      handleSubmit,
    })

    const { container } = render(<LoginForm />)

    const passwordInput = screen.getByPlaceholderText('••••••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(container.querySelector('button[type="button"]') as HTMLButtonElement)
    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text')
    })

    await user.click(screen.getByRole('button', { name: /entrar al combate/i }))
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('swaps to the success flow when the login hook reports success', () => {
    mockedUseLogin.mockReturnValue({
      email: '',
      setEmail: vi.fn(),
      password: '',
      setPassword: vi.fn(),
      isLoading: false,
      isSuccess: true,
      profileRoute: '/perfil',
      error: null,
      handleSubmit: vi.fn(),
    })

    render(<LoginForm />)

    expect(screen.getAllByRole('button', { name: /entrar al arena/i })[0]).toBeInTheDocument()
  })

  it('exchanges the google credential and navigates to the lobby', async () => {
    const user = userEvent.setup()

    mockedAuthApi.post.mockResolvedValueOnce({
      data: {
        accessToken: 'token-1',
        refreshToken: 'refresh-1',
        userId: 'user-1',
        username: 'Neo',
        email: 'neo@example.com',
        role: 'PLAYER',
      },
    })

    render(<SocialAuth />)

    await user.click(screen.getByTestId('google-login'))

    await waitFor(() => {
      expect(mockedAuthApi.post).toHaveBeenCalledWith('/auth/oauth/google', { idToken: 'mock-credential' })
      expect(navigateMock).toHaveBeenCalledWith('/lobby')
    })

    expect(localStorage.getItem('fight_club_token')).toBe('token-1')
    expect(localStorage.getItem('fight_club_refresh')).toBe('refresh-1')
  })
})