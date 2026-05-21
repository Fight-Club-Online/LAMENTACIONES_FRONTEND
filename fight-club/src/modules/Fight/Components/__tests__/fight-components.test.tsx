import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FooterSelectCharacter } from '../SelectCharacter/footerSC'
import { HeaderSelectCharacter } from '../SelectCharacter/headerSC'
import { StartFightButton } from '../SelectCharacter/StartFightButton'
import FightHUD from '../EnviromentFight/FightHUD'
import { FightResultScreen } from '../EnviromentFight/FightResultScreen'
import { useCreateFight } from '../../Hooks/useCreateFight'
import type { Fight } from '../../types/fight'

const navigateMock = vi.fn()
const mockedUseCreateFight = vi.mocked(useCreateFight)

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../Hooks/useCreateFight', () => ({
  useCreateFight: vi.fn(),
}))

describe('Fight components', () => {
  const gameState: Fight = {
    id: 'fight-1',
    active: false,
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
      characterName: 'Neo',
      characterLevel: 10,
      health: { currentHealth: 25, maxHealth: 100 },
      posX: 0,
      posY: 0,
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
      characterName: 'Rival',
      characterLevel: 11,
      health: { currentHealth: 0, maxHealth: 100 },
      posX: 0,
      posY: 0,
      velocityX: 0,
      velocityY: 0,
      isGrounded: true,
      direction: 'LEFT',
      currentAction: 'HURT',
      isBlocking: false,
      currentStunFrames: 0,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the select-character header and footer states', async () => {
    const user = userEvent.setup()

    render(<HeaderSelectCharacter isConnected={true} />)
    expect(screen.getByText(/seleccionar personaje/i)).toBeInTheDocument()
    expect(screen.getByText(/conectado/i)).toBeInTheDocument()

    render(<FooterSelectCharacter bothPlayersReady={false} onStartFight={vi.fn()} />)
    expect(screen.getByRole('button', { name: /esperando a ambos jugadores/i })).toBeDisabled()
  })

  it('calls the fight creation hook from the start button', async () => {
    const user = userEvent.setup()
    const createAndStartFight = vi.fn().mockResolvedValue(undefined)

    mockedUseCreateFight.mockReturnValue({
      isLoading: false,
      error: null,
      createAndStartFight,
    })

    render(
      <StartFightButton
        roomCode="ROOM-1"
        player1Id="user-1"
        player2Id="user-2"
      />
    )

    await user.click(screen.getByRole('button', { name: /¡comenzar!/i }))

    expect(createAndStartFight).toHaveBeenCalledWith('ROOM-1', 'user-1', 'user-2')
  })

  it('shows the contextual HUD actions and player health', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    const onHelp = vi.fn()
    const onClaim = vi.fn()
    const onTakeBack = vi.fn()

    render(
      <FightHUD
        gameState={gameState}
        userId="user-1"
        onStart={onStart}
        onHelp={onHelp}
        onClaim={onClaim}
        onTakeBack={onTakeBack}
      />
    )

    expect(screen.getByText(/neo/i)).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
    expect(screen.getByText(/solicitar refuerzo/i)).toBeInTheDocument()
    expect(screen.getByText(/iniciar combate/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /solicitar refuerzo/i }))
    expect(onHelp).toHaveBeenCalledTimes(1)
  })

  it('renders the fight result screen and returns to the lobby', async () => {
    const user = userEvent.setup()

    render(
      <FightResultScreen
        result="WIN"
        gameState={gameState}
        userId="user-1"
        pointsChange={30}
        player1Username="Neo"
        player2Username="Rival"
      />
    )

    expect(screen.getByText(/victoria/i)).toBeInTheDocument()
    expect(screen.getByText('+30')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /volver al lobby/i }))
    expect(navigateMock).toHaveBeenCalledWith('/lobby', { replace: true })

    await waitFor(() => {
      expect(screen.getByText(/resultado de la partida/i)).toBeInTheDocument()
    })
  })
})