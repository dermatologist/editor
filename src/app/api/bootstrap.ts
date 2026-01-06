import "reflect-metadata";

import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { OllamaEmbeddings } from "@langchain/ollama";
import { RedisVectorStore } from "@langchain/redis";
// The new version hits /api/embed as opposed to /api/embeddings in the deprecated version
// Cannot upgrade now
// import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
// import {Ollama } from "@langchain/community/llms/ollama";
import { TavilySearch } from "@langchain/tavily";
import { BaseEmbedding, BaseLLM } from "medpromptjs";
import { createClient } from "redis";
import { container } from "tsyringe";
// import { VertexAI } from "@langchain/google-vertexai";
// import { GoogleVertexAIEmbeddings } from "@langchain/community/embeddings/googlevertexai";

const bootstrap = async (name: string = "", llmChoice?: string) => {
  // If the container is already registered, and no indexName set, just return it.
  // Prevents overwriting the container.
  if (container.isRegistered("main-llm") && name === "" && !llmChoice)
    return container;
  else container.clearInstances();

  let indexName: string =
    name || process.env.NEXT_PUBLIC_INDEX_NAME || "common";
  // Append suffix to force creation of new 4096-dim index
  indexName = `${indexName}`;

  let llm_choice: string = llmChoice || process.env.NEXT_PUBLIC_LLM || "gemini";
  let main_llm: any = null;

  // try{
  // const vertex = new VertexAI({
  //     temperature: 0.6,
  //     maxOutputTokens: 256,
  //     model: "gemini-pro",
  // })
  // main_llm = vertex;
  // } catch (error) {
  // const ollama = new Ollama({
  //     baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
  //     model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "phi3:mini",
  //     numPredict: 128,
  //     temperature: 0.6,
  // });

  const ollama = new BaseLLM({
    baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
    apiKey: process.env.NEXT_PUBLIC_OLLAMA_API_KEY || "",
    model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "phi3:mini",
  });

  const gemini = new ChatGoogleGenerativeAI({
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-pro",
    temperature: 0.6,
    maxRetries: 1,
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    maxOutputTokens: process.env.NEXT_PUBLIC_MAX_OUTPUT_TOKENS
      ? parseInt(process.env.NEXT_PUBLIC_MAX_OUTPUT_TOKENS)
      : 256,
    // other params...
  });

  if (llm_choice === "ollama") {
    main_llm = ollama;
  } else {
    main_llm = gemini;
  }

  if (llm_choice === "half") {
    // get a random choice
    const choices = [ollama, gemini];
    main_llm = choices[Math.floor(Math.random() * choices.length)];
  }

  const redis_client: any = await createClient({
    url: process.env.NEXT_PUBLIC_REDIS_URL || "redis://localhost:6379",
  })
    .on("error", (err: any) => console.log("Redis Client Error", err))
    .connect();

  // let embedding: any = null;
  // try {
  //     embedding = new GoogleVertexAIEmbeddings();
  // } catch (error) {

  // const embedding = new BaseEmbedding({
  //   baseUrl:
  //     process.env.NEXT_PUBLIC_OLLAMA_EMBEDDING_URL || "http://localhost:11434",
  //   apiKey: process.env.NEXT_PUBLIC_OLLAMA_API_KEY || "",
  //   model: process.env.NEXT_PUBLIC_OLLAMA_EMBEDDING_MODEL || "embeddings-phi3",
  // });

  const embedding = new OllamaEmbeddings({
    model: "all-minilm", // default model
    baseUrl: "http://localhost:11434", // default base URL
  });

  const vectorstore = await new RedisVectorStore(embedding, {
    redisClient: await redis_client,
    indexName: indexName,
  });

  // const main_llm = new OllamaFunctions({
  //     temperature: 0.6,
  //     model: "phi3",
  //     numPredict: 32,
  // });

  //   const suggestion_prompt = ChatPromptTemplate.fromMessages([
  //     [
  //       "system",
  //       "You're a text improvement agent. Please suggest improvements for only the text between the square brackets using additional context: {search}",
  //     ],
  //     ["human", `{before} [{selection}] {after}`],
  //   ]);

  const suggestion_prompt = PromptTemplate.fromTemplate(
    "You're a text improvement agent. Please suggest improvements for only the text between the square brackets using additional context: {search}\n\n{before} [{selection}] {after}"
  );

  //   const rag_prompt = ChatPromptTemplate.fromMessages([
  //     [
  //       "system",
  //       "You're a research assistant. You have access to the following research material\n\n[{context}].",
  //     ],
  //     ["human", "Please tell me: {question}"],
  //   ]);

  const rag_prompt = PromptTemplate.fromTemplate(
    "You are a research assistant. You have access to the following research material:\n\n{context}\n\nPlease tell me: {question}"
  );
  //   const gen_prompt = ChatPromptTemplate.fromMessages([
  //     ["system", "You are a text completion agent."],
  //     ["human", "Expand and complete {question}"],
  //   ]);

  const gen_prompt = PromptTemplate.fromTemplate(
    "Expand and complete the following text:\n\n{question}"
  );

  const prompt = gen_prompt;
  // Define the tools the agent will have access to.
  let tools: any = [];
  try {
    tools = [
      new TavilySearch({
        maxResults: 1,
        tavilyApiKey: process.env.NEXT_PUBLIC_TAVILY_KEY || "nokey",
      }),
    ];
    // tools = [];
  } catch (error) {
    console.log("\nTavilySearch not available.");
  }

  container.register("index-name", {
    useValue: indexName,
  });

  container.register("main-llm", {
    useValue: main_llm,
  });

  container.register("llm", {
    useValue: ollama,
  });

  container.register("prompt", {
    useValue: prompt,
  });

  container.register("suggestion-prompt", {
    useValue: suggestion_prompt,
  });

  container.register("rag-prompt", {
    useValue: rag_prompt,
  });

  container.register("tools", {
    useValue: tools,
  });

  container.register("redis-client", {
    useValue: redis_client,
  });

  container.register("embedding", {
    useValue: embedding,
  });

  container.register("vectorstore", {
    useValue: vectorstore,
  });

  container.register("zotero-key", {
    useValue: process.env.NEXT_PUBLIC_ZOTERO_KEY || "nokey",
  });

  container.register("zotero-userid", {
    useValue: process.env.NEXT_PUBLIC_ZOTERO_USERID || "nouser",
  });

  container.register("zoter-collectionid", {
    useValue: process.env.NEXT_PUBLIC_ZOTERO_COLLECTIONID || "nocollection",
  });

  return container;
};

export default bootstrap;
