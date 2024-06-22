import "reflect-metadata";
import { container } from "tsyringe";
import {Ollama } from "@langchain/community/llms/ollama";
import { ChatPromptTemplate} from "langchain/prompts";
import { VertexAI } from "@langchain/google-vertexai";
import { createClient } from "redis";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RedisVectorStore } from "@langchain/redis";
import { GoogleVertexAIEmbeddings } from "@langchain/community/embeddings/googlevertexai";

const bootstrap = async () => {

    const client: any = await createClient(
        {
            url: "redis://10.130.3.3:6379",
        }
        )
        .on('error', (err: any) => console.log('Redis Client Error', err))
        .connect();

    // const embedding: OllamaEmbeddings =  new OllamaEmbeddings({
    //         model: "all-minilm",
    //         baseUrl: "http://10.0.0.211:11434", // default value
    //     });

    const embedding = new GoogleVertexAIEmbeddings();

    const vectorstore = await new RedisVectorStore(embedding, {
        redisClient: await client,
        indexName: "testdocs",
    });


    const vertex = new VertexAI({
        temperature: 0.7,
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
        "You're a completion assistant. Given the part of a sentence and some context, try to complete the sentence using the context if possible. \n\nHere is the context:{context}. If context is not relevant use your own knowledge to complete",
    ],
    ["human", "{question}"],
    ]);

    // Define the tools the agent will have access to.
    // const tools = [new TavilySearchResults({ maxResults: 1, apiKey: process.env.NEXT_PUBLIC_TAVILY_KEY })];

    container.register("main-llm", {
        useValue: vertex,
    });


    container.register("prompt", {
        useValue: prompt,
    });

    container.register("suggestion-prompt", {
        useValue: suggestion_prompt,
    });

    container.register("tools", {
        useValue: [],
    });

    container.register("client", {
        useValue: client,
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