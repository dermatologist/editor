import "reflect-metadata";
import { container } from "tsyringe";
import {Ollama } from "@langchain/community/llms/ollama";
import { ChatPromptTemplate} from "langchain/prompts";
import { z } from "zod";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { createClient } from "redis";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RedisVectorStore } from "@langchain/redis";
// import { VertexAI } from "@langchain/google-vertexai";
// import { GoogleVertexAIEmbeddings } from "@langchain/community/embeddings/googlevertexai";

const bootstrap = async () => {

    const indexName: string = "genai-derm";

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
        baseUrl: "http://10.0.0.211:11434",
        model: "phi3",
        numPredict: 128,
        temperature: 0.6,
    });
    main_llm = ollama;
    // }

    const redis_client: any = await createClient(
        {
            url: "redis://10.0.0.211:6379",
        }
        )
        .on('error', (err: any) => console.log('Redis Client Error', err))
    .connect();

    let embedding: any = null;
    // try {
    //     embedding = new GoogleVertexAIEmbeddings();
    // } catch (error) {

        embedding =  new OllamaEmbeddings({
        model: "all-minilm",
        baseUrl: "http://10.0.0.211:11434", // default value
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

    return container;
}

export default bootstrap;