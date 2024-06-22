import "reflect-metadata";
import { container } from "tsyringe";
import {Ollama } from "@langchain/community/llms/ollama";
import { ChatPromptTemplate} from "langchain/prompts";
import { z } from "zod";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { createClient } from "redis";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RedisVectorStore } from "@langchain/redis";


const bootstrap = async () => {

    const redis_client: any = await createClient(
        {
            url: "redis://10.0.0.211:6379",
        }
        )
        .on('error', (err: any) => console.log('Redis Client Error', err))
    .connect();

    const embedding: OllamaEmbeddings =  new OllamaEmbeddings({
        model: "all-minilm",
        baseUrl: "http://10.0.0.211:11434", // default value
    });

    const vectorstore = await new RedisVectorStore(embedding, {
        redisClient: await redis_client,
        indexName: "testdocs",
    });

    const ollama = new Ollama({
        baseUrl: "http://10.0.0.211:11434",
        model: "phi3"
    });

    const suggestion_prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You're a text improvement agent. Please suggest improvements for only the text between the square brackets using additional context: {search}",
    ],
    ["human", `{before} [{selection}] {after}`],
    ]);

    const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You're a completion assistant. Given the part of a sentence and some context, try to complete the sentence using the context between square brackets. \n\n[{context}]. If context is not relevant or empty use your own knowledge to complete",
    ],
    ["human", "{question}"],
    ]);

    // Define the tools the agent will have access to.
    const tools = [new TavilySearchResults({ maxResults: 1, apiKey: process.env.NEXT_PUBLIC_TAVILY_KEY })];

    container.register("main-llm", {
        useValue: ollama,
    });


    container.register("prompt", {
        useValue: prompt,
    });

    container.register("suggestion-prompt", {
        useValue: suggestion_prompt,
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

    return container;
}

export default bootstrap;