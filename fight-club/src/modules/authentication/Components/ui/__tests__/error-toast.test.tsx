import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, afterEach } from 'vitest'
import { act } from '@testing-library/react'
import { ErrorToast } from '../ErrorToast'

describe('ErrorToast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render when message is null', () => {
    const { container } = render(<ErrorToast message={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders when message is provided', async () => {
    render(<ErrorToast message={'Algo malo pasó'} />)
    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
    expect(screen.getByText('Algo malo pasó')).toBeInTheDocument()
  })

  it('auto-dismisses after timeout when autoDismiss is true and calls onDismiss', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    try {
      render(<ErrorToast message={'Auto'} onDismiss={onDismiss} autoDismiss={true} />)

      // let effects run
      await act(async () => {
        // microtask flush
        await Promise.resolve()
      })

      // advance timers to trigger auto-dismiss
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // allow component to process state update
      await act(async () => Promise.resolve())

      expect(onDismiss).toHaveBeenCalled()
      expect(screen.queryByText('Error')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears timeout on unmount and does not call onDismiss', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    try {
      const { unmount } = render(<ErrorToast message={'Auto'} onDismiss={onDismiss} autoDismiss={true} />)

      // allow effects
      await act(async () => Promise.resolve())

      // unmount before timeout fires
      unmount()
      act(() => vi.advanceTimersByTime(5000))

      expect(onDismiss).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('manual dismiss via button calls onDismiss and hides component', async () => {
    const onDismiss = vi.fn()
    render(<ErrorToast message={'Click me'} onDismiss={onDismiss} autoDismiss={false} />)

    await waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())
    const btn = screen.getByRole('button')
    await userEvent.click(btn)
    expect(onDismiss).toHaveBeenCalled()
    expect(screen.queryByText('Error')).toBeNull()
  })
})
