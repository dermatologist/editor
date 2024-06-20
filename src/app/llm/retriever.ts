import { createClient } from "redis";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RedisVectorStore } from "@langchain/redis";

const client = await createClient(
  {
    url: "redis://10.0.0.211:6379",
  }
)
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

const embeddings = new OllamaEmbeddings({
    model: "all-minilm",
    baseUrl: "http://10.0.0.211:11434", // default value
});

const vectorStore = new RedisVectorStore(embeddings, {
  redisClient: client,
  indexName: "docs",
});

const retriever = async (search: string = "") => {
    return await vectorStore.similaritySearch(search,3);
}

export const vectorStoreAsRetriever = vectorStore.asRetriever();

export default retriever;