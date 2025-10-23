import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Ensure API requests use relative paths in tests
process.env.NEXT_PUBLIC_API_URL = ''

// Mock window.alert to prevent JSDOM errors
global.alert = jest.fn()

// Add custom matchers for specification-driven testing
expect.extend({
  toBeWithinRange(received, min, max) {
    const pass = received >= min && received <= max;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min}-${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min}-${max}`,
        pass: false,
      };
    }
  },

  toMeetSuccessMetric(received, target) {
    const pass = received >= target;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to meet success metric ${target}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to meet success metric ${target}`,
        pass: false,
      };
    }
  }
});

// Polyfills for MSW in Node.js environment
const { Response, Request, Headers } = require('whatwg-fetch')
if (typeof global.Response === 'undefined') {
  global.Response = global.Response || Response
}
if (typeof global.Request === 'undefined') {
  global.Request = global.Request || Request
}
if (typeof global.Headers === 'undefined') {
  global.Headers = global.Headers || Headers
}
