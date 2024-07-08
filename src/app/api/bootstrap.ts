import "reflect-metadata";

import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import {Ollama } from "@langchain/community/llms/ollama";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatPromptTemplate} from "@langchain/core/prompts";
import { RedisVectorStore } from "@langchain/redis";
import { createClient } from "redis";
import { container } from "tsyringe";
import { z } from "zod";
// import { VertexAI } from "@langchain/google-vertexai";
// import { GoogleVertexAIEmbeddings } from "@langchain/community/embeddings/googlevertexai";

const bootstrap = async (name: string = "") => {
    // If the container is already registered, and no indexName set, just return it.
    // Prevents overwriting the container.
    if (container.isRegistered("main-llm") && name ==="")
        return container;
    else
        container.clearInstances();
    
    const indexName: string = name || process.env.NEXT_PUBLIC_INDEX_NAME || "common";

    let main_llm = null;

    // try{
    // const vertex = new VertexAI({
    //     temperature: 0.6,
    //     maxOutputTokens: 256,
    //     model: "gemini-pro",
    // })
    // main_llm = vertex;
    // } catch (error) {
    const ollama = new Ollama({
        baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
        model: process.env.NEXT_PUBLIC_OLLAMA_MODEL || "phi3:mini",
        numPredict: 128,
        temperature: 0.6,
    });
    main_llm = ollama;
    // }

    const redis_client: any = await createClient(
        {
            url: process.env.NEXT_PUBLIC_REDIS_URL || "redis://localhost:6379",
        }
        )
        .on('error', (err: any) => console.log('Redis Client Error', err))
    .connect();

    let embedding: any = null;
    // try {
    //     embedding = new GoogleVertexAIEmbeddings();
    // } catch (error) {

        embedding =  new OllamaEmbeddings({
        model: process.env.NEXT_PUBLIC_EMBEDDING_MODEL || "all-minilm",
        baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
        });
    // }
    const vectorstore = await new RedisVectorStore(embedding, {
        redisClient: await redis_client,
        indexName: indexName,
    });


    // const main_llm = new OllamaFunctions({
    //     temperature: 0.6,
    //     model: "phi3",
    //     numPredict: 32,
    // });

    const suggestion_prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You're a text improvement agent. Please suggest improvements for only the text between the square brackets using additional context: {search}",
    ],
    ["human", `{before} [{selection}] {after}`],
    ]);

    const rag_prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You're a research assistant. You have access to the following research material\n\n[{context}].",
    ],
    ["human", "Please tell me: {question}"],
    ]);

    const gen_prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are a text completion agent.",
    ],
    ["human", "Expand and complete {question}"],
    ]);


    const prompt = gen_prompt;
    // Define the tools the agent will have access to.
    let tools: any = []
    try{
        tools = [new TavilySearchResults({ maxResults: 1, apiKey: process.env.NEXT_PUBLIC_TAVILY_KEY })];
    } catch (error) {
        console.log("\nTavilySearch not available.")
    }

    container.register("index-name", {
        useValue: indexName,
    });

    container.register("main-llm", {
        useValue: main_llm,
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
}

export default bootstrap;