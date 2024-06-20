import { createClient } from "redis";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RedisVectorStore } from "@langchain/redis";



export class RedisRetreiver {
  get_client = async () => {
      const client: any = await createClient(
      {
        url: "redis://10.0.0.211:6379",
      }
    )
      .on('error', (err: any) => console.log('Redis Client Error', err))
      .on('connect', () => console.log('Redis Client Connected'));

    const embeddings = new OllamaEmbeddings({
        model: "all-minilm",
        baseUrl: "http://localhost:11434", // default value
    });

    const vectorStore = new RedisVectorStore(embeddings, {
      redisClient: client,
      indexName: "docs",
    });

    return vectorStore.asRetriever();
  }
}