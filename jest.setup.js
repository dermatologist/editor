// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock fetch for all tests
global.fetch = jest.fn(function() {
  return Promise.resolve({
    json: function() { return Promise.resolve({}); },
  });
});

