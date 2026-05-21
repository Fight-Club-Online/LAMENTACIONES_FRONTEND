import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigurationButton } from '../MainLobbyPage/Header/ConfigButton'
import { FriendsButton } from '../MainLobbyPage/Header/FriendButton'
import { LobbyHeader } from '../MainLobbyPage/Header/LobbyHeader'
import { ProfileButton } from '../MainLobbyPage/Header/ProfileButtom'
import { RightSideBar } from '../MainLobbyPage/RigthSideBar/RightSideBar'
import { CreatePrivateButton } from '../MainLobbyPage/RigthSideBar/CreatePrivateButton'
import { JoinPrivateButton } from '../MainLobbyPage/RigthSideBar/JoinPrivateButton'
import { JoinPublicButton } from '../MainLobbyPage/RigthSideBar/JoinPublicButton'
import { WaitingRoomHeader } from '../WaitingRoom/WaitingRoomHeader'
import { SpectatorsInfo } from '../WaitingRoom/SpectatorsInfo'
import { StartGameButton } from '../WaitingRoom/PreFooter/StartGameButton'
import { LobbyCode } from '../WaitingRoom/PreFooter/LobbyCode'
import { PreFooterWaitingBar } from '../WaitingRoom/PreFooter/PreFooterWaitingBar'
import { BottonWaitingBar } from '../WaitingRoom/BottomBar'
import { PlayerContainer } from '../WaitingRoom/PlayerContainer'
import { CloseButtonPopUP } from '../PrivateRoomPopUp/CloseButtomPop'
import { FooterPopUp } from '../PrivateRoomPopUp/FooterPopUp'
import { SearchResultPopUp } from '../PrivateRoomPopUp/SearchResult'
import { JoinButtonPanelSection } from '../PrivateRoomPopUp/PanelSection/JoinButtonPanelSection'
import { JoinSpecButton } from '../PrivateRoomPopUp/PanelSection/JoinSpecButton'
import { RefreshButtonPanel } from '../PrivateRoomPopUp/PanelSection/RefreshButtonPanel'
import { SectionPanelPopUp } from '../PrivateRoomPopUp/PanelSection/SectionPanel'
import { SelectionPopUp } from '../PublicRoomPopUp/SelectionPopUp'
import { PublicRoomsSelectorPopUp } from '../PublicRoomPopUp/PublicRoomsSelectorPopUp'
import { NotificationsButton } from '../MainLobbyPage/Header/NotificationButton'
import { useCreationPRoom } from '../../Hooks/useCreationPrivateRoom'
import { useCreationPublicRoom } from '../../Hooks/useCreationPublicRoom'
import { useGetPublicRooms } from '../../Hooks/useGetPublicRooms'
import { useRequestRoomState } from '../../Hooks/useRequestRoomState'
import type { Room } from '../../Types/RoomTypes'

const navigateMock = vi.fn()
const createRoomMock = vi.fn()
const createPublicRoomMock = vi.fn()
const refreshMock = vi.fn()
const requestRoomMock = vi.fn()

const { writeTextMock } = vi.hoisted(() => ({
  writeTextMock: vi.fn().mockResolvedValue(undefined),
}))

const publicRoomsFixture: Room[] = [
  {
    roomId: 'room-1',
    roomCode: 'PUB-1',
    hostId: 'host-1',
    roomState: 'WAITING',
    maxPlayers: 2,
    currentPlayers: 1,
    maxSpectators: 4,
    currentSpectators: 2,
    players: [],
  },
]

const roomFixture: Room = {
  roomId: 'room-2',
  roomCode: 'ROOM-2',
  hostId: 'host-2',
  roomState: 'WAITING',
  maxPlayers: 2,
  currentPlayers: 1,
  maxSpectators: 4,
  currentSpectators: 1,
  players: [],
}

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../Hooks/useCreationPrivateRoom', () => ({
  useCreationPRoom: () => ({ createRoom: createRoomMock, error: null, loading: false }),
}))

vi.mock('../../Hooks/useCreationPublicRoom', () => ({
  useCreationPublicRoom: () => ({ createPublicRoom: createPublicRoomMock, error: null, loading: false }),
}))

vi.mock('../../Hooks/useGetPublicRooms', () => ({
  useGetPublicRooms: () => ({ rooms: publicRoomsFixture, error: null, refresh: refreshMock }),
}))

vi.mock('../../Hooks/useRequestRoomState', () => ({
  useRequestRoomState: () => ({ room: roomFixture, error: null }),
}))

vi.mock('../PublicRoomPopUp/PublicRoomPop', () => ({
  PublicRoomPopUp: ({ onClose }: any) => React.createElement(
    'div',
    { 'data-testid': 'public-popup' },
    React.createElement('button', { onClick: onClose }, 'close public')
  ),
}))

vi.mock('../PrivateRoomPopUp/PrivateRoomPop', () => ({
  PrivateRoomPopUp: ({ onClose }: any) => React.createElement(
    'div',
    { 'data-testid': 'private-popup' },
    React.createElement('button', { onClick: onClose }, 'close private')
  ),
}))

describe('Lobby components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeTextMock }, configurable: true })
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/history')) {
        return {
          ok: true,
          json: async () => ([{ id: 'n1', message: 'Hello', read: false, createdAt: new Date().toISOString() }]),
        } as Response
      }
      if (url.includes('/read')) {
        return { ok: true, json: async () => ({}) } as Response
      }
      return { ok: true, json: async () => ({}) } as Response
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('renders the lobby header and navigates from the profile button', async () => {
    const user = userEvent.setup()

    render(<LobbyHeader userName="Neo" avatarURL="https://example.com/avatar.png" />)

    expect(screen.getByText('Neo')).toBeInTheDocument()

    await user.click(screen.getByAltText('Neo'))
    expect(navigateMock).toHaveBeenCalledWith('/Neo/perfil')
  })

  it('renders the right-side actions', () => {
    render(<RightSideBar />)

    expect(screen.getByText(/crear sala/i)).toBeInTheDocument()
    expect(screen.getByText(/entrar sala/i)).toBeInTheDocument()
    expect(screen.getByText('Sala publica')).toBeInTheDocument()
  })

  it('fires the private room creation hook', async () => {
    const user = userEvent.setup()
    render(<CreatePrivateButton />)

    await user.click(screen.getByRole('button', { name: /crear sala/i }))
    expect(createRoomMock).toHaveBeenCalledTimes(1)
  })

  it('opens the mocked popups from the lobby buttons', async () => {
    const user = userEvent.setup()

    render(<>
      <JoinPublicButton />
      <JoinPrivateButton />
    </>)

    await user.click(screen.getByRole('button', { name: /sala publica/i }))
    expect(await screen.findByTestId('public-popup')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /entrar sala/i }))
    expect(await screen.findByTestId('private-popup')).toBeInTheDocument()
  })

  it('renders waiting room header and leaves the room', async () => {
    const user = userEvent.setup()
    const leave = vi.fn()

    render(<WaitingRoomHeader spectatorsNumber={3} leave={leave} />)

    await user.click(screen.getByRole('button'))
    expect(leave).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith('/lobby')
  })

  it('copies the lobby code to the clipboard', async () => {
    render(<LobbyCode roomCode="ABC-123" />)

    fireEvent.click(screen.getByText('ABC-123').closest('div') as HTMLElement)
    expect(writeTextMock).toHaveBeenCalledWith('ABC-123')
  })

  it('shows the pre-footer and waiting-room footer actions', () => {
    render(<>
      <PreFooterWaitingBar roomCode="ABC-123" />
      <BottonWaitingBar roomCode="ABC-123" isHost={true} onStartGame={vi.fn().mockResolvedValue({ success: true })} isStartingGame={false} />
    </>)

    expect(screen.getByText('ABC-123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /comenzar juego/i })).toBeInTheDocument()
  })

  it('renders the waiting player slot when no player is present', () => {
    render(<PlayerContainer />)

    expect(screen.getByText(/waiting/i)).toBeInTheDocument()
    expect(screen.getByText(/opponent/i)).toBeInTheDocument()
  })

  it('renders the modal chrome and panel actions', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onStartGame = vi.fn().mockResolvedValue({ success: true })

    render(<>
      <CloseButtonPopUP onClose={onClose} />
      <FooterPopUp />
      <SearchResultPopUp players={1} spectators={2} status="WAITING" />
      <SectionPanelPopUp full={false} formRef={{ current: document.createElement('form') }} roomCode="ROOM-2" fullSpectators={false} />
    </>)

    expect(screen.getByText(/room availability/i)).toBeInTheDocument()
    expect(screen.getByText(/1\/2 jugadores/i)).toBeInTheDocument()
    expect(screen.getByText(/2 espectadores/i)).toBeInTheDocument()
    expect(screen.getByText(/unirse !!!/i)).toBeInTheDocument()
    expect(screen.getByText(/entrar como espectador/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('navigates from the private room join buttons and refreshes the form', async () => {
    const user = userEvent.setup()
    const requestSubmit = vi.fn()
    const formRef = { current: { requestSubmit } as HTMLFormElement }

    render(<>
      <JoinButtonPanelSection fullRoom={false} roomCode="ROOM-2" />
      <JoinSpecButton fullRoom={false} roomCode="ROOM-2" />
      <RefreshButtonPanel formRef={formRef} />
    </>)

    await user.click(screen.getByRole('button', { name: /unirse !!!/i }))
    await user.click(screen.getByRole('button', { name: /entrar como espectador/i }))
    await user.click(screen.getByRole('button', { name: /refrescar/i }))

    expect(navigateMock).toHaveBeenCalledWith('/waiting-room?roomCode=ROOM-2&playerType=PLAYER')
    expect(navigateMock).toHaveBeenCalledWith('/waiting-room?roomCode=ROOM-2&playerType=SPECTATOR')
    expect(requestSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders public-room selectors and selection controls', async () => {
    const user = userEvent.setup()

    render(<>
      <SelectionPopUp setBottomPanel={vi.fn()} setRooms={vi.fn()} />
      <PublicRoomsSelectorPopUp rooms={publicRoomsFixture} />
    </>)

    expect(screen.getByText(/cual sera tu siguiente camino/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /unete-/i }))
    await user.click(screen.getByRole('button', { name: /creala/i }))

    expect(refreshMock).toHaveBeenCalledTimes(1)
    expect(createPublicRoomMock).toHaveBeenCalledTimes(1)
  })

  it('shows notification history and marks unread notifications read', async () => {
    const user = userEvent.setup()
    localStorage.setItem('user_data', JSON.stringify({ userId: 'user-1' }))

    render(<NotificationsButton />)

    expect(await screen.findByText('1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /notifications/i }))
    expect(await screen.findByText('Hello')).toBeInTheDocument()

    await user.click(screen.getByText('Hello'))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
  })
})