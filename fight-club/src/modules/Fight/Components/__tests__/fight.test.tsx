import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockCreateAndStartFight = vi.fn();
const mockUseCreateFight = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../Hooks/useCreateFight', () => ({
  useCreateFight: () => mockUseCreateFight(),
}));

import FightHUD from '../EnviromentFight/FightHUD';
import { FightResultScreen } from '../EnviromentFight/FightResultScreen';
import { HeaderSelectCharacter } from '../SelectCharacter/headerSC';
import { FooterSelectCharacter } from '../SelectCharacter/footerSC';
import { StartFightButton } from '../SelectCharacter/StartFightButton';

const gameState = {
  active: false,
  helpButton: {
    status: 'ACTIVE',
    visible: false,
    activatedForUserId: 'user-1',
    claimedByUserId: null,
  },
  player1: {
    userId: 'user-1',
    characterName: 'Samurai',
    health: { currentHealth: 75, maxHealth: 100 },
  },
  player2: {
    userId: 'user-2',
    characterName: 'Demonio',
    health: { currentHealth: 20, maxHealth: 100 },
  },
};

describe('fight and select character components', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockCreateAndStartFight.mockReset();
    mockUseCreateFight.mockReturnValue({
      isLoading: false,
      error: null,
      createAndStartFight: mockCreateAndStartFight,
    });
  });

  it('renders the select character header and footer states', () => {
    render(<HeaderSelectCharacter isConnected />);
    expect(screen.getByText('SELECCIONAR PERSONAJE')).toBeInTheDocument();
    expect(screen.getByText('Conectado')).toBeInTheDocument();

    render(<FooterSelectCharacter bothPlayersReady={false} onStartFight={vi.fn()} />);
    expect(screen.getByText('ESPERANDO A AMBOS JUGADORES...')).toBeInTheDocument();
  });

  it('starts a fight from the CTA button', () => {
    render(
      <StartFightButton
        roomCode="ROOM-1"
        player1Id="user-1"
        player2Id="user-2"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /¡comenzar!/i }));
    expect(mockCreateAndStartFight).toHaveBeenCalledWith('ROOM-1', 'user-1', 'user-2');
  });

  it('renders the fight HUD and help button state', () => {
    render(
      <FightHUD
        gameState={gameState as any}
        userId="user-1"
        onStart={vi.fn()}
        onHelp={vi.fn()}
        onClaim={vi.fn()}
        onTakeBack={vi.fn()}
      />
    );

    expect(screen.getByText('Samurai')).toBeInTheDocument();
    expect(screen.getByText('Demonio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar combate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /solicitar refuerzo/i })).toBeInTheDocument();
  });

  it('renders the result screen and navigates back to lobby', () => {
    render(
      <FightResultScreen
        result="WIN"
        gameState={gameState as any}
        userId="user-1"
        pointsChange={28}
        player1Username="Samurai"
        player2Username="Demonio"
      />
    );

    expect(screen.getByText('VICTORIA')).toBeInTheDocument();
    expect(screen.getByText('+28')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /volver al lobby/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/lobby', { replace: true });
  });
});