import '@testing-library/jest-dom/vitest';
import React from 'react';
import { afterEach, vi } from 'vitest';

const motionProps = new Set([
  'initial',
  'animate',
  'transition',
  'exit',
  'variants',
  'whileHover',
  'whileTap',
  'whileFocus',
  'drag',
  'dragConstraints',
  'dragElastic',
  'layout',
]);

vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) =>
    React.forwardRef<any, any>(({ children, ...props }, ref) => {
      const domProps = Object.fromEntries(
        Object.entries(props).filter(([key]) => !motionProps.has(key))
      );
      return React.createElement(tag, { ref, ...domProps }, children);
    });

  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => createMotionComponent(tag),
    }
  );

  return { motion };
});

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: ({ onSuccess }: any) => (
    <button
      type="button"
      data-testid="google-login"
      onClick={() => onSuccess?.({ credential: 'google-test-token' })}
    >
      Google
    </button>
  ),
}));

vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
vi.stubGlobal('cancelAnimationFrame', vi.fn());

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    globalAlpha: 1,
    fillStyle: '',
    filter: '',
  })),
});

afterEach(() => {
  vi.clearAllMocks();
});