import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { AchievementsPanel } from '../AchievementsPanel';
import { PlayerDashboard } from '../PlayerDashboard';
import { ProfileCard } from '../ProfileCard';
import { RankSystemModal } from '../RankSystemModal';
import { StatsCards } from '../StatsCards';
import { WinRatePanel } from '../WinRatePanel';

const baseStats = {
  level: 12,
  points: 845,
  streak: 0,
  followers: 128,
  totalFights: 0,
  wins: 32,
  losses: 18,
  draws: 4,
  userId: 'user-1',
  rank: 'PLATA_II' as const,
  achievements: ['PRIMERA_SANGRE', 'VETERANO'] as const,
};

const baseProfile = {
  userId: 'user-1',
  username: 'Gladiador',
  bio: 'Forjado en combate',
  city: 'Bogota',
  country: 'CO',
  avatarURL: 'https://example.com/avatar.png',
};

describe('authentication profile components', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.clear();
  });

  it('renders the stats cards with zero-state placeholders', () => {
    render(<StatsCards stats={baseStats} />);

    expect(screen.getByText('Racha')).toBeInTheDocument();
    expect(screen.getByText('Puntos')).toBeInTheDocument();
    expect(screen.getByText('Seguidores')).toBeInTheDocument();
    expect(screen.getByText('Combates')).toBeInTheDocument();
    expect(screen.getAllByText('--')).toHaveLength(2);
  });

  it('shows unlocked and locked achievements', () => {
    render(<AchievementsPanel achievements={['PRIMERA_SANGRE', 'VETERANO']} />);

    expect(screen.getByText('2/8')).toBeInTheDocument();
    expect(screen.getByText('Primera Sangre')).toBeInTheDocument();
    expect(screen.getByText('Leyenda')).toBeInTheDocument();
  });

  it('opens the rank system modal', () => {
    render(<RankSystemModal />);

    fireEvent.click(screen.getByRole('button', { name: /ver sistema de rangos/i }));
    expect(screen.getByAltText('Sistema de Rangos Fight Club')).toBeInTheDocument();
  });

  it('renders the win rate panel with computed values', () => {
    render(<WinRatePanel stats={baseStats} achievements={['PRIMERA_SANGRE']} />);

    expect(screen.getByText('Perfil de Combate')).toBeInTheDocument();
    expect(screen.getByText('Plata II')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('845 / 900 pts')).toBeInTheDocument();
  });

  it('enters edit mode and saves profile changes', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(<ProfileCard profile={baseProfile} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByTitle('Editar Perfil'));
    fireEvent.change(screen.getByDisplayValue('Gladiador'), {
      target: { value: 'Campeon' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar datos/i }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ username: 'Campeon' }));
    });
  });

  it('redirects the dashboard when no session data exists', async () => {
    render(
      <MemoryRouter>
        <PlayerDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});