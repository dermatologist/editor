# Magic Editor - Development Notes

## Recent Changes (2026-01-06)

### Button-Based Interaction Model
The editor has been updated from an auto-trigger model to a button-based interaction model:

#### Citation Suggestions
- **Old Behavior**: Citations were automatically triggered when text was selected and user waited (750ms debounce)
- **New Behavior**: User must select text and click "Suggest Citations" button
- **Validation**: Shows alert if no text is selected when button is clicked
- **API**: Uses `/api/citation` endpoint

#### Sentence Generation
- **Old Behavior**: Auto-completion was triggered during typing inactivity (500ms debounce)
- **New Behavior**: User clicks "Next 3 Sentences" button to generate content
- **Validation**: Shows alert if document has less than 32 characters
- **API**: Uses new `/api/sentences` endpoint
- **Context**: Generates based on last 256 characters of context

#### LLM Selection
- **Old Behavior**: LLM was chosen randomly (50/50) or via environment variable
- **New Behavior**: Dropdown selector allows user to choose between Gemini and Ollama
- **Default**: Gemini is the default LLM
- **Integration**: Selected LLM is passed to sentence generation API

### Technical Implementation

#### Frontend Changes
- `src/app/components/editor/editor.tsx`: 
  - Added EditorControls component with buttons and LLM selector
  - Removed auto-trigger for suggestions and completions
  - Added state management for LLM selection
  
- `src/app/components/editor/utils.ts`:
  - Replaced `debouncedGetSuggestions` with `manualGetSuggestions`
  - Removed auto-trigger completion logic
  - Added `useSentenceGeneration` hook
  - Added `fetchSentences` API call function
  - Updated `fetchCompletion` to accept LLM parameter

#### Backend Changes
- `src/app/api/bootstrap.ts`:
  - Updated to accept `llmChoice` parameter
  - Changed default LLM from "ollama" to "gemini"
  
- `src/app/api/sentences/`:
  - New endpoint for sentence generation
  - `chain.ts`: Implements SentenceChainService with custom prompt
  - `route.ts`: Handles POST requests with text and LLM selection

#### Testing
- Created test infrastructure with Jest
- Added 19 unit tests covering:
  - Button functionality and validation
  - LLM selector behavior
  - API endpoint structure
  - Context selection logic
  - Constants validation

### Future Improvements

1. **Streaming Responses**
   - Consider implementing streaming for sentence generation
   - Show progressive output as it's generated

2. **Customizable Sentence Count**
   - Allow users to specify number of sentences (currently fixed at 3)
   - Add input field or slider for sentence count

3. **Better Error Handling**
   - Replace alerts with toast notifications
   - Show more specific error messages
   - Add retry mechanism for failed requests

4. **Citation Quality**
   - Improve citation relevance scoring
   - Add citation preview on hover
   - Allow citation filtering by source type

5. **Context Awareness**
   - Make sentence generation more contextually aware
   - Consider document structure (headings, paragraphs)
   - Support multiple writing styles (academic, casual, technical)

6. **Performance**
   - Implement request caching for repeated queries
   - Add loading indicators with progress
   - Optimize LLM switching (avoid re-bootstrap)

7. **User Experience**
   - Add keyboard shortcuts for buttons (e.g., Ctrl+Shift+C for citations)
   - Remember user's LLM preference in localStorage
   - Add undo/redo for AI-generated content

8. **Testing**
   - Add integration tests with real API calls (in CI environment)
   - Add E2E tests with Playwright or Cypress
   - Test with different LLM configurations

## Technical Notes

### LangChain Dependency Conflicts
- Current codebase has TypeScript errors due to version conflicts between `medpromptjs` and `@langchain/core`
- These are pre-existing and do not affect runtime functionality
- Consider updating to compatible versions or removing medpromptjs dependency

### Build Configuration
- Next.js 13.5.4 is used (has security vulnerabilities, consider upgrading)
- Uses `--legacy-peer-deps` for npm install due to dependency conflicts
- Font loading from Google Fonts may fail in restricted network environments

## Development Commands

```bash
npm install --legacy-peer-deps  # Install dependencies
npm run dev                      # Start development server
npm run build                    # Build for production
npm run lint                     # Run ESLint
npm run fix                      # Auto-fix linting issues
npm test                         # Run Jest tests
npm test:watch                   # Run tests in watch mode
```

## API Endpoints

- `POST /api/citation` - Get citation suggestions for selected text
- `POST /api/sentences` - Generate next sentences with LLM choice
- `POST /api/llmcompletion` - Legacy completion endpoint (kept for compatibility)
- `POST /api/upload` - Upload and index documents
- `POST /api/zotero` - Index Zotero collection
- `POST /api/webpage` - Index web page content
- `POST /api/setindex` - Set current Redis index

## Environment Variables

- `NEXT_PUBLIC_LLM` - Default LLM choice (gemini/ollama/half)
- `NEXT_PUBLIC_GEMINI_MODEL` - Gemini model name (default: gemini-1.5-flash)
- `NEXT_PUBLIC_OLLAMA_MODEL` - Ollama model name (default: phi3:mini)
- `NEXT_PUBLIC_OLLAMA_URL` - Ollama service URL (default: http://localhost:11434)
- `NEXT_PUBLIC_GOOGLE_API_KEY` - Google API key for Gemini
- `NEXT_PUBLIC_REDIS_URL` - Redis connection URL
- `NEXT_PUBLIC_INDEX_NAME` - Default Redis index name
- `NEXT_PUBLIC_TAVILY_KEY` - Tavily search API key
- `NEXT_PUBLIC_ZOTERO_KEY` - Zotero API key
- `NEXT_PUBLIC_ZOTERO_USERID` - Zotero user ID
- `NEXT_PUBLIC_ZOTERO_COLLECTIONID` - Zotero collection ID

## Google
* https://js.langchain.com/v0.2/docs/integrations/platforms/google/