import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AchievementsPanel } from '../AchievementsPanel'
import { HistoryPanel } from '../HistoryPanel'
import { ProfileCard } from '../ProfileCard'
import { RankSystemModal } from '../RankSystemModal'
import { StatsCards } from '../StatsCards'
import { WinRatePanel } from '../WinRatePanel'
import type { Achievement, UserProfile, UserStats } from '../../../types/dashboard.types'

const { mockedGet, mockedAuthGet } = vi.hoisted(() => ({
  mockedGet: vi.fn(),
  mockedAuthGet: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: mockedGet,
  },
}))

vi.mock('../../../Config/axios', () => ({
  default: {
    get: mockedAuthGet,
  },
}))

describe('Profile components', () => {
  const stats: UserStats = {
    userId: 'user-1',
    wins: 12,
    losses: 3,
    draws: 1,
    followers: 40,
    totalFights: 16,
    points: 875,
    level: 7,
    streak: 4,
    rank: 'ORO_I',
    achievements: ['PRIMERA_SANGRE', 'VETERANO'],
  }

  const profile: UserProfile = {
    id: 'profile-1',
    userId: 'user-1',
    username: 'Neo',
    bio: 'Ready to fight',
    country: 'CO',
    city: 'Bogota',
    avatarURL: 'https://example.com/avatar.png',
    notification: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows the profile skeleton while data is missing', () => {
    const { container } = render(<ProfileCard profile={null} onUpdate={vi.fn()} />)

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('allows editing and saving the profile card', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(<ProfileCard profile={profile} onUpdate={onUpdate} />)

    await user.click(screen.getByTitle('Editar Perfil'))
    const [nameInput, bioInput] = screen.getAllByRole('textbox')

    await user.clear(nameInput)
    await user.type(nameInput, 'Neo Prime')
    await user.clear(bioInput)
    await user.type(bioInput, 'More battle text')
    await user.click(screen.getByRole('button', { name: /actualizar datos/i }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ username: 'Neo Prime', bio: 'More battle text' }))
    })
  })

  it('renders stats cards from the stats object', () => {
    render(<StatsCards stats={stats} />)

    expect(screen.getByText('Racha')).toBeInTheDocument()
    expect(screen.getByText('875')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
  })

  it('renders achievements with unlocked and locked states', () => {
    render(<AchievementsPanel achievements={['PRIMERA_SANGRE', 'VETERANO'] as Achievement[]} />)

    expect(screen.getByText('2/8')).toBeInTheDocument()
    expect(screen.getByText('Primera Sangre')).toBeInTheDocument()
    expect(screen.getByText('Veterano')).toBeInTheDocument()
  })

  it('renders win-rate and rank progress information', () => {
    render(<WinRatePanel stats={stats} achievements={stats.achievements} />)

    expect(screen.getAllByText('Oro I')[0]).toBeInTheDocument()
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('75%') ?? false)[0]).toBeInTheDocument()
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('875 / 900 pts') ?? false)[0]).toBeInTheDocument()
    expect(screen.getByText('2/8')).toBeInTheDocument()
  })

  it('opens and closes the rank modal', async () => {
    const user = userEvent.setup()
    render(<RankSystemModal />)

    await user.click(screen.getByRole('button', { name: /ver sistema de rangos/i }))
    expect(screen.getByAltText(/sistema de rangos fight club/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button')[1])
    await waitFor(() => {
      expect(screen.queryByAltText(/sistema de rangos fight club/i)).not.toBeInTheDocument()
    })
  })

  it('loads and renders fight history rows', async () => {
    localStorage.setItem('user_data', JSON.stringify({ userId: 'user-1' }))
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 'fight-1',
          opponentId: 'op-1',
          opponentName: 'Enemy',
          result: 'VICTORIA',
          pointsChange: 30,
          fightDate: new Date().toISOString(),
        },
      ],
    })
    mockedAuthGet.mockResolvedValueOnce({ data: { username: 'Rival' } })

    render(<HistoryPanel />)

    expect(screen.getByText(/historial de la arena/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/vs rival/i)).toBeInTheDocument()
      expect(screen.getByText('+30 pts')).toBeInTheDocument()
    })
  })
})