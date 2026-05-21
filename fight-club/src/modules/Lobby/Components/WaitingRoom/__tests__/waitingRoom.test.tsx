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

import { LobbyCode } from '../PreFooter/LobbyCode';
import { SpectatorsInfo } from '../SpectatorsInfo';
import { StartGameButton } from '../PreFooter/StartGameButton';
import { WaitingRoomHeader } from '../WaitingRoomHeader';

describe('lobby waiting room components', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  it('shows spectator counts and the waiting room code', () => {
    render(<SpectatorsInfo spectatorsNumber={14} />);
    expect(screen.getByText('Spectators (14)')).toBeInTheDocument();

    render(<LobbyCode roomCode="ABC-123" />);
    expect(screen.getByText('ABC-123')).toBeInTheDocument();
  });

  it('copies the lobby code to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<LobbyCode roomCode="ROOM-77" />);
    fireEvent.click(screen.getByText('ROOM-77'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('ROOM-77');
    });
  });

  it('starts the game and shows loading text while pending', async () => {
    const onStartGame = vi.fn().mockResolvedValue({ success: true });

    render(<StartGameButton onStartGame={onStartGame} isStartingGame={false} />);
    fireEvent.click(screen.getByRole('button', { name: /comenzar juego/i }));

    await waitFor(() => {
      expect(onStartGame).toHaveBeenCalledTimes(1);
    });
  });

  it('leaves the room and returns to the lobby', () => {
    const leave = vi.fn();

    render(
      <MemoryRouter>
        <WaitingRoomHeader spectatorsNumber={3} leave={leave} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(leave).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/lobby');
  });
});