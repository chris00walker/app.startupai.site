import '@testing-library/jest-dom'

// Mock window.alert to prevent JSDOM errors
global.alert = jest.fn()
