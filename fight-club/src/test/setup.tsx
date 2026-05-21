import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_target, tag: string) => {
      return ({ children, ...props }: any) => React.createElement(tag, props, children)
    },
  })

  return {
    motion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  }
})

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: any) => React.createElement(
    'button',
    {
      type: 'button',
      'data-testid': 'google-login',
      onClick: () => onSuccess?.({ credential: 'mock-credential' }),
    },
    'Google Login'
  ),
}))

const canvasContextMock = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  setTransform: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  rect: vi.fn(),
  globalAlpha: 1,
  filter: 'none',
  fillStyle: '#000',
  strokeStyle: '#000',
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => canvasContextMock),
})

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  configurable: true,
})

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = ((callback: FrameRequestCallback) => window.setTimeout(() => callback(Date.now()), 0)) as unknown as typeof requestAnimationFrame
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = ((handle: number) => window.clearTimeout(handle)) as unknown as typeof cancelAnimationFrame
}

afterEach(() => {
  cleanup()
})