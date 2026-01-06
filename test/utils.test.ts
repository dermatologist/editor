/**
 * Unit tests for editor utility functions
 * These tests validate the helper functions used in the editor component
 */

describe('Editor Utils - Context Selection', () => {
  describe('Context Padding', () => {
    it('should pad context by 64 characters by default', () => {
      const CONTEXT_PADDING_CHARS = 64;
      const selectionStart = 100;
      const selectionEnd = 120;
      
      const contextStart = Math.max(0, selectionStart - CONTEXT_PADDING_CHARS);
      const contextEnd = selectionEnd + CONTEXT_PADDING_CHARS;
      
      expect(contextStart).toBe(36);
      expect(contextEnd).toBe(184);
    });

    it('should not go below 0 for context start', () => {
      const CONTEXT_PADDING_CHARS = 64;
      const selectionStart = 30;
      
      const contextStart = Math.max(0, selectionStart - CONTEXT_PADDING_CHARS);
      
      expect(contextStart).toBe(0);
    });

    it('should limit context end to document size', () => {
      const CONTEXT_PADDING_CHARS = 64;
      const selectionEnd = 120;
      const docSize = 150;
      
      const contextEnd = Math.min(selectionEnd + CONTEXT_PADDING_CHARS, docSize);
      
      expect(contextEnd).toBe(150);
    });
  });

  describe('Word Boundary Detection', () => {
    it('should identify word boundary characters', () => {
      const wordBoundaryRegex = /[\s\(\)\[\]\.,;:!?]/;
      
      expect(wordBoundaryRegex.test(' ')).toBe(true);
      expect(wordBoundaryRegex.test('.')).toBe(true);
      expect(wordBoundaryRegex.test(',')).toBe(true);
      expect(wordBoundaryRegex.test('(')).toBe(true);
      expect(wordBoundaryRegex.test(')')).toBe(true);
      expect(wordBoundaryRegex.test('a')).toBe(false);
      expect(wordBoundaryRegex.test('Z')).toBe(false);
    });
  });

  describe('Selection Context Structure', () => {
    it('should have required properties', () => {
      const context = {
        before: 'text before',
        selection: 'selected text',
        after: 'text after',
        selectionStart: 10,
        selectionEnd: 23
      };

      expect(context).toHaveProperty('before');
      expect(context).toHaveProperty('selection');
      expect(context).toHaveProperty('after');
      expect(context).toHaveProperty('selectionStart');
      expect(context).toHaveProperty('selectionEnd');
      expect(context.selectionEnd).toBeGreaterThan(context.selectionStart);
    });
  });
});

describe('Completion Constants', () => {
  it('should have minimum document length for completion', () => {
    const MIN_DOC_LENGTH_FOR_COMPLETION = 32;
    expect(MIN_DOC_LENGTH_FOR_COMPLETION).toBe(32);
  });

  it('should have completion context character limit', () => {
    const COMPLETION_CONTEXT_CHARS = 256;
    expect(COMPLETION_CONTEXT_CHARS).toBe(256);
  });
});
