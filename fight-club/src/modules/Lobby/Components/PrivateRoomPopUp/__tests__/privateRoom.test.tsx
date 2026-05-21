import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockRequestRoomState = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../Hooks/useRequestRoomState', () => ({
  useRequestRoomState: (args: any) => mockRequestRoomState(args),
}));

import { CloseButtonPopUP } from '../CloseButtomPop';
import { FooterPopUp } from '../FooterPopUp';
import { InputSectionPopUp } from '../InputSectionPop';
import { JoinButtonPanelSection } from '../PanelSection/JoinButtonPanelSection';
import { JoinSpecButton } from '../PanelSection/JoinSpecButton';
import { RefreshButtonPanel } from '../PanelSection/RefreshButtonPanel';
import { SearchResultPopUp } from '../SearchResult';
import { SectionPanelPopUp } from '../PanelSection/SectionPanel';

describe('lobby private room popup components', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockRequestRoomState.mockReset();
  });

  it('renders the search result summary and footer separators', () => {
    render(<SearchResultPopUp players={1} spectators={4} status="OPEN" />);
    expect(screen.getByText('1/2 Jugadores | 4 Espectadores')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();

    render(<FooterPopUp />);
    expect(screen.getAllByText('----------------------').length).toBeGreaterThan(0);
  });

  it('closes with the close button and refreshes via the form ref', () => {
    const onClose = vi.fn();
    const formRef = { current: { requestSubmit: vi.fn() } } as any;

    render(<CloseButtonPopUP onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);

    render(<RefreshButtonPanel formRef={formRef} />);
    fireEvent.click(screen.getByRole('button', { name: /refrescar/i }));
    expect(formRef.current.requestSubmit).toHaveBeenCalledTimes(1);
  });

  it('navigates to waiting rooms from the join buttons', () => {
    render(
      <MemoryRouter>
        <div>
          <JoinButtonPanelSection fullRoom={false} roomCode="ROOM-9" />
          <JoinSpecButton fullRoom={false} roomCode="ROOM-9" />
        </div>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Unirse !!!'));
    fireEvent.click(screen.getByText('Entrar Como Espectador'));

    expect(mockNavigate).toHaveBeenCalledWith('/waiting-room?roomCode=ROOM-9&playerType=PLAYER');
    expect(mockNavigate).toHaveBeenCalledWith('/waiting-room?roomCode=ROOM-9&playerType=SPECTATOR');
  });

  it('renders the section panel and room search state', () => {
    mockRequestRoomState.mockReturnValue({
      room: {
        currentPlayers: 1,
        currentSpectators: 2,
        roomState: 'OPEN',
      },
      error: null,
    });

    const formRef = { current: { requestSubmit: vi.fn() } } as any;
    render(
      <MemoryRouter>
        <SectionPanelPopUp full={false} formRef={formRef} roomCode="ROOM-9" fullSpectators={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Unirse !!!')).toBeInTheDocument();
    expect(screen.getByText('Entrar Como Espectador')).toBeInTheDocument();
  });

  it('shows the input section state from the request hook', async () => {
    mockRequestRoomState.mockReturnValue({
      room: { currentPlayers: 2, currentSpectators: 0, roomState: 'OPEN' },
      error: null,
    });

    const setBottomPanel = vi.fn();
    const setRoom = vi.fn();
    const formRef = { current: null } as any;

    render(
      <MemoryRouter>
        <InputSectionPopUp setBottomPanel={setBottomPanel} formRef={formRef} setRoom={setRoom} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('XJ9-KINETIC-00'), {
      target: { value: 'ROOM-9' },
    });
    fireEvent.submit(screen.getByPlaceholderText('XJ9-KINETIC-00').closest('form') as HTMLFormElement);

    expect(screen.getByText('Buscar')).toBeInTheDocument();
    expect(setBottomPanel).toHaveBeenCalledWith(true);
  });
});