# Magic Editor

Fully-featured AI-powered text editor with button-based citation suggestions and sentence generation.

Live at [editor.jennmueng.com](https://editor.jennmueng.com).

## Features

### 🎯 Button-Based Interactions
- **Suggest Citations**: Select text and click to get relevant citation suggestions from indexed documents
- **Next 3 Sentences**: Generate contextually relevant sentences based on your current content
- **LLM Selector**: Choose between Gemini or Ollama for sentence generation

### 📚 Document Management
- Upload and index PDF documents
- Index Zotero collections
- Index web pages for citation reference

### 🤖 AI-Powered Assistance
- Smart citation suggestions from your document library
- Context-aware sentence generation
- Support for multiple LLM backends (Gemini, Ollama)

## Running Locally

After installing dependencies, run the development server:

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the editor.

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test:watch
```

## Usage

1. **Getting Citations**: 
   - Select any text in the editor
   - Click "Suggest Citations" button
   - Choose from the suggested citations
   
2. **Generating Content**:
   - Write at least a few words
   - Select your preferred LLM (Gemini/Ollama)
   - Click "Next 3 Sentences" button
   - Review and accept the generated content (press TAB)

3. **Indexing Documents**:
   - Use the file upload to add PDFs to your index
   - Connect your Zotero collection for automatic indexing
   - Add web pages as reference material

## Configuration

See `notes/notes.md` for detailed configuration options and environment variables.

## Development

See `notes/notes.md` for development notes, API documentation, and future improvements.