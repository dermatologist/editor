# Test Suite

This directory contains unit tests for the Magic Editor application.

## Test Structure

- `api.test.ts` - Tests for API endpoint behavior and mocking
- `buttons.test.ts` - Tests for button functionality and user interactions
- `utils.test.ts` - Tests for editor utility functions and constants

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test buttons.test.ts
```

## Test Coverage

### API Tests (6 tests)
- Citation API response handling
- Sentence generation API with LLM parameter
- Bootstrap LLM selection

### Button Tests (8 tests)
- Citation button validation (no text selected)
- Citation button with text selection
- Sentence generation button validation (insufficient content)
- Sentence generation with LLM selection
- Loading state management
- LLM selector default value
- LLM selector switching
- LLM parameter passing

### Utils Tests (5 tests)
- Context padding calculation
- Word boundary detection
- Selection context structure
- Completion constants validation

## Adding New Tests

When adding new features:

1. Create or update test file in this directory
2. Use Jest matchers for assertions
3. Mock external dependencies (API calls, browser APIs)
4. Follow the existing test structure
5. Ensure tests are isolated and can run in any order

## Test Configuration

- Configuration: `jest.config.js` (project root)
- Setup: `jest.setup.js` (project root)
- Environment: jsdom (for DOM testing)

## Notes

- All tests mock the `fetch` API to avoid actual network calls
- Tests use `@testing-library/jest-dom` for DOM assertions
- Next.js configuration is loaded automatically by `next/jest`
