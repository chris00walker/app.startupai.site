// Jest polyfills for Node.js environment
// Use relative API paths in tests
process.env.NEXT_PUBLIC_API_URL = '/api'
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Polyfill BroadcastChannel
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Polyfill TransformStream (used by MSW)
if (typeof global.TransformStream === 'undefined') {
  try {
    const { TransformStream } = require('stream/web');
    if (TransformStream) {
      global.TransformStream = TransformStream;
    } else {
      global.TransformStream = class {};
    }
  } catch {
    global.TransformStream = class {};
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
