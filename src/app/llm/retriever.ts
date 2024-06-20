import { createClient } from "redis";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RedisVectorStore } from "@langchain/redis";

const client = createClient({
  url: process.env.NEXT_PUBLIC_REDIS_URL ?? "redis://localhost:6379",
});

const embeddings = new OllamaEmbeddings({
    model: "all-minilm",
    baseUrl: "http://localhost:11434", // default value
});

const vectorStore = new RedisVectorStore(embeddings, {
  redisClient: client,
  indexName: "docs",
});

const retriever = async (search: string = "") => {
    await client.connect();
    return await vectorStore.similaritySearch(search,3);
}

export const vectorStoreAsRetriever = vectorStore.asRetriever();

export default retriever;