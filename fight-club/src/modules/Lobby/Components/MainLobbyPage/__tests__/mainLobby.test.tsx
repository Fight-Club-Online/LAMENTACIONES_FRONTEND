import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockCreateRoom = vi.fn();
const mockUseCreationPRoom = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../Hooks/useCreationPrivateRoom', () => ({
  useCreationPRoom: () => mockUseCreationPRoom(),
}));

import { ProfileButton } from '../Header/ProfileButtom';
import { FriendsButton } from '../Header/FriendButton';
import { NotificationsButton } from '../Header/NotificationButton';
import { ConfigurationButton } from '../Header/ConfigButton';
import { LobbyHeader } from '../Header/LobbyHeader';
import { RightSideBar } from '../RigthSideBar/RightSideBar';
import { CreatePrivateButton } from '../RigthSideBar/CreatePrivateButton';
import { JoinPrivateButton } from '../RigthSideBar/JoinPrivateButton';
import { JoinPublicButton } from '../RigthSideBar/JoinPublicButton';

vi.mock('../../PrivateRoomPopUp/PrivateRoomPop', () => ({
  PrivateRoomPopUp: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>PrivateRoomPopUp</span>
      <button onClick={onClose}>close-private</button>
    </div>
  ),
}));

vi.mock('../../PublicRoomPopUp/PublicRoomPop', () => ({
  PublicRoomPopUp: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>PublicRoomPopUp</span>
      <button onClick={onClose}>close-public</button>
    </div>
  ),
}));

describe('lobby main page components', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockCreateRoom.mockReset();
    mockUseCreationPRoom.mockReturnValue({ createRoom: mockCreateRoom });
    localStorage.clear();
  });

  it('renders the lobby header and profile button', () => {
    render(
      <MemoryRouter>
        <LobbyHeader userName="Gladiador" avatarURL="https://example.com/avatar.png" />
      </MemoryRouter>
    );

    expect(screen.getByText('Lobby')).toBeInTheDocument();
    expect(screen.getByText('Gladiador')).toBeInTheDocument();
  });

  it('navigates from the profile button', () => {
    render(
      <MemoryRouter>
        <ProfileButton userName="Gladiador" avatarURL="avatar" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Gladiador'));
    expect(mockNavigate).toHaveBeenCalledWith('/Gladiador/perfil');
  });

  it('renders the sidebar actions and create-room hook', () => {
    render(
      <MemoryRouter>
        <RightSideBar />
      </MemoryRouter>
    );

    expect(screen.getByText('Crear sala')).toBeInTheDocument();
    expect(screen.getByText('Entrar sala')).toBeInTheDocument();
    expect(screen.getByText('Sala publica')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Crear sala'));
    expect(mockCreateRoom).toHaveBeenCalledTimes(1);
  });

  it('opens the private and public room popups from the action buttons', () => {
    render(
      <MemoryRouter>
        <div>
          <JoinPrivateButton />
          <JoinPublicButton />
        </div>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Entrar sala'));
    fireEvent.click(screen.getByText('Sala publica'));

    expect(screen.getByText('PrivateRoomPopUp')).toBeInTheDocument();
    expect(screen.getByText('PublicRoomPopUp')).toBeInTheDocument();
  });

  it('renders the remaining header buttons', () => {
    render(
      <MemoryRouter>
        <div>
          <FriendsButton />
          <NotificationsButton />
          <ConfigurationButton />
        </div>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'group' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'notifications' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });
});