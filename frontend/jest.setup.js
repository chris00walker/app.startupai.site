import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock window.alert to prevent JSDOM errors
global.alert = jest.fn()

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
