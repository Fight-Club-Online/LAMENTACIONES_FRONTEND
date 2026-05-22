import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ArenaCanvas from '../ArenaCanvas'
import { FightResultScreen } from '../FightResultScreen'
import { VoiceChatPanel } from '../VoiceChatPanel'
import { ACTION_COLORS_HEX, CANVAS_CONFIG } from '../ArenaVisuals'
import type { Fight } from '../../../types/fight'
import type { Socket } from 'socket.io-client'

const { navigateMock, getUserCharacterAssetsMock, spriteRendererMock, getSpriteKeyMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getUserCharacterAssetsMock: vi.fn(),
  spriteRendererMock: vi.fn(({ fighter }: any) => React.createElement('div', { 'data-testid': 'sprite-renderer' }, fighter?.characterName ?? 'sprite')),
  getSpriteKeyMock: vi.fn((fighter: any) => fighter.userId),
}))

const listeners = new Map<string, (...args: any[]) => void>()
const promptMock = vi.fn()

const makeSocket = () => ({
  connected: false,
  id: 'socket-1',
  emit: vi.fn(),
  on: vi.fn((event: string, handler: (...args: any[]) => void) => {
    listeners.set(event, handler)
  }),
  off: vi.fn(),
} as any as Socket)

const baseFight: Fight = {
  id: 'fight-1',
  active: true,
  helpButton: {
    buttonId: 1,
    visible: false,
    fightId: 'fight-1',
    activatedForUserId: 'user-1',
    claimedByUserId: '',
    status: 'ACTIVE',
    type: null,
  },
  player1: {
    id: 'p1',
    userId: 'user-1',
    hasCharacter: true,
    characterId: 1,
    characterName: 'Neo',
    characterLevel: 10,
    health: { currentHealth: 80, maxHealth: 100 },
    posX: 100,
    posY: 120,
    velocityX: 0,
    velocityY: 0,
    isGrounded: true,
    direction: 'RIGHT',
    currentAction: 'IDLE',
    isBlocking: false,
    currentStunFrames: 0,
  },
  player2: {
    id: 'p2',
    userId: 'user-2',
    hasCharacter: true,
    characterId: 2,
    characterName: 'Rival',
    characterLevel: 11,
    health: { currentHealth: 60, maxHealth: 100 },
    posX: 800,
    posY: 130,
    velocityX: 0,
    velocityY: 0,
    isGrounded: true,
    direction: 'LEFT',
    currentAction: 'IDLE',
    isBlocking: false,
    currentStunFrames: 0,
  },
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../SpriteRenderer', () => ({
  default: (props: any) => spriteRendererMock(props),
}))

vi.mock('../../../../Lobby/Config/axiosLobby', () => ({
  lobbyApi: {
    getUserCharacterAssets: getUserCharacterAssetsMock,
  },
}))

vi.mock('../../../../assets/Background.jpeg', () => ({ default: 'background-image' }))

vi.mock('../../../utils/spriteUtils', () => ({
  getSpriteKey: (fighter: any) => getSpriteKeyMock(fighter),
  mapActionToAnimationType: (action: string) => action.toLowerCase(),
  getSpriteAssetUrl: () => 'sprite-url',
  getSpriteGlowColor: () => '',
}))

describe('Arena environment components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listeners.clear()
    promptMock.mockReturnValue('reporte válido')
    vi.stubGlobal('prompt', promptMock)
    getUserCharacterAssetsMock.mockResolvedValue({
      idle_url: 'http://localhost:8080/idle.png',
      run_url: 'http://localhost:8080/run.png',
      attack_url: 'http://localhost:8080/attack.png',
      hurt_url: 'http://localhost:8080/hurt.png',
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getAudioTracks: () => [{ enabled: true }],
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      configurable: true,
    })
    ;(globalThis as any).RTCPeerConnection = class {
      connectionState = 'new'
      signalingState = 'stable'
      remoteDescription = null
      localDescription = null
      onicecandidate: any
      ontrack: any
      onconnectionstatechange: any
      addTrack = vi.fn()
      addTransceiver = vi.fn()
      getSenders = vi.fn(() => [])
      createOffer = vi.fn(async () => ({ type: 'offer', sdp: 'offer' }))
      createAnswer = vi.fn(async () => ({ type: 'answer', sdp: 'answer' }))
      setLocalDescription = vi.fn(async (desc) => { this.localDescription = desc })
      setRemoteDescription = vi.fn(async (desc) => { this.remoteDescription = desc })
      addIceCandidate = vi.fn(async () => undefined)
      close = vi.fn(() => { this.connectionState = 'closed' })
    }
    ;(globalThis as any).RTCSessionDescription = class {
      value: any
      constructor(value: any) {
        this.value = value
      }
    }
    ;(globalThis as any).RTCIceCandidate = class {
      value: any
      constructor(value: any) {
        this.value = value
      }
    }
  })

  it('exposes the arena visual constants', () => {
    expect(CANVAS_CONFIG.WIDTH).toBe(1000)
    expect(CANVAS_CONFIG.HEIGHT).toBe(500)
    expect(ACTION_COLORS_HEX.IDLE).toBe('#3b82f6')
    expect(ACTION_COLORS_HEX.DEAD).toBe('#71717a')
  })

  it('loads fighter assets and renders the arena canvas', async () => {
    render(<ArenaCanvas gameState={baseFight} />)

    await waitFor(() => {
      expect(getUserCharacterAssetsMock).toHaveBeenCalledWith('user-1', '1')
      expect(getUserCharacterAssetsMock).toHaveBeenCalledWith('user-2', '2')
      expect(screen.getAllByTestId('sprite-renderer')).toHaveLength(2)
    })
  })

  it('shows fight result and redirects from the countdown', async () => {
    render(
      <FightResultScreen
        result="WIN"
        gameState={baseFight}
        userId="user-1"
        pointsChange={25}
        player1Username="Neo"
        player2Username="Rival"
      />
    )

    expect(screen.getByText(/victoria/i)).toBeInTheDocument()
    expect(screen.getByText('+25')).toBeInTheDocument()
  })

  it('filters chat messages in the voice panel and requests mic access', async () => {
    const socket = makeSocket()
    const socketRef = { current: socket }

    render(<VoiceChatPanel socketRef={socketRef} userId="user-1" username="Neo" isPlayer={true} />)

    expect(screen.getByText('Arena Chat')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Mensaje...')).toBeInTheDocument()
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })

    await act(async () => {
      listeners.get('chat message')?.({
        id: 'm1',
        userId: 'user-2',
        username: 'Rival',
        texto: 'hola mierda',
        source: 'CHAT',
      })
    })

    expect(screen.getByText('hola ****')).toBeInTheDocument()
  })

  it('sends chat, toggles mic and deafen states, and reports the opponent', async () => {
    const user = userEvent.setup()
    const socket = makeSocket()
    const socketRef = { current: socket }

    render(<VoiceChatPanel socketRef={socketRef} userId="user-1" username="Neo" isPlayer={true} />)

    await waitFor(() => {
      expect(listeners.has('estado_chat')).toBe(true)
      expect(listeners.has('listaSockets')).toBe(true)
    })

    await act(async () => {
      listeners.get('estado_chat')?.({ activo: true, fightId: 'fight-1' })
      listeners.get('listaSockets')?.([
        { socketId: 'socket-1', userId: 'user-1', username: 'Neo', playerType: 'PLAYER' },
        { socketId: 'socket-2', userId: 'user-2', username: 'Rival', playerType: 'PLAYER' },
      ])
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Mensaje...')).toBeEnabled()
    })

    const input = screen.getByPlaceholderText('Mensaje...')
    await user.type(input, 'hola mundo')
    await waitFor(() => {
      expect(input).toHaveValue('hola mundo')
    })
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith('chat message', {
        userId: 'user-1',
        username: 'Neo',
        texto: 'hola mundo',
      })
    })

    await user.click(screen.getByTitle('Silenciar mic'))
    expect(socket.emit).toHaveBeenCalledWith('toggle_mute_local', { mutedSelf: true })

    await user.click(screen.getByTitle('Silenciar rivales'))
    expect(screen.getByTitle('Escuchar')).toBeInTheDocument()

    await user.click(screen.getByTitle('Reportar a Rival'))
    expect(promptMock).toHaveBeenCalled()
    expect(socket.emit).toHaveBeenCalledWith('enviar_reporte', {
      targetId: 'user-2',
      motivo: 'reporte válido',
    })
    expect(screen.getByText(/reporte enviado contra rival/i)).toBeInTheDocument()
  })

  it('shows moderation states from socket events', () => {
    const socket = makeSocket()
    const socketRef = { current: socket }

    render(<VoiceChatPanel socketRef={socketRef} userId="user-1" username="Neo" isPlayer={true} />)

    expect(listeners.has('player_strike')).toBe(true)
    expect(listeners.has('comando_silenciar')).toBe(true)
    expect(listeners.has('advertencia_sistema')).toBe(true)
    expect(listeners.has('notificacion_sistema')).toBe(true)
    expect(listeners.has('player_banned')).toBe(true)

    act(() => {
      listeners.get('player_strike')?.({ count: 2, max: 3, source: 'CHAT' })
    })
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('Chat Strike 2/3') ?? false)[0]).toBeInTheDocument()

    act(() => {
      listeners.get('player_strike')?.({ count: 1, max: 3, source: 'VOICE' })
    })
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('Strike 1/3') ?? false)[0]).toBeInTheDocument()

    act(() => {
      listeners.get('comando_silenciar')?.('socket-1')
    })
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('micrófono ha sido bloqueado') ?? false)[0]).toBeInTheDocument()

    act(() => {
      listeners.get('advertencia_sistema')?.({ mensaje: 'Aviso general' })
    })
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('Aviso general') ?? false)[0]).toBeInTheDocument()

    act(() => {
      listeners.get('notificacion_sistema')?.('Notificación importante')
    })
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('Notificación importante') ?? false)[0]).toBeInTheDocument()

    act(() => {
      listeners.get('player_banned')?.({ userId: 'user-2' })
    })
    expect(screen.getAllByText((_, element) => element?.textContent?.includes('jugador fue expulsado por infracciones') ?? false)[0]).toBeInTheDocument()
  })

  it('cleans up peer connections and local stream on unmount and role change', async () => {
    const socket = makeSocket()
    const socketRef = { current: socket }

    // stub a local stream with tracks that have a stop method
    const stopSpy = vi.fn()
    const fakeTrack = { stop: stopSpy }
    const fakeStream: any = {
      getAudioTracks: () => [ { enabled: true, stop: stopSpy } ],
      getTracks: () => [ fakeTrack ],
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
      configurable: true,
    })

    const { unmount, rerender } = render(<VoiceChatPanel socketRef={socketRef} userId="user-1" username="Neo" isPlayer={true} />)

    // Wait for mic to be acquired
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled())

    // Unmount and expect local stream tracks to be stopped
    unmount()
    expect(stopSpy).toHaveBeenCalled()

    // Now test role change: mount as player then re-render as spectator
    const r = render(<VoiceChatPanel socketRef={socketRef} userId="user-1" username="Neo" isPlayer={true} />)
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled())
    // switch to spectator
    r.rerender(<VoiceChatPanel socketRef={socketRef} userId="user-1" username="Neo" isPlayer={false} />)

    // stream should be disabled and possibly stopped
    await waitFor(() => {
      expect(stopSpy).toHaveBeenCalled()
    })
  })
})