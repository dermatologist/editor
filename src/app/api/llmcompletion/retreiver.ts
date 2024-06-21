import { createClient } from "redis";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { RedisVectorStore } from "@langchain/redis";



export class RedisRetreiver {

    client: any;
    embeddings: OllamaEmbeddings;
    vectorStore: any;

    constructor() {
        this.client = this.get_client();
        this.embeddings = this.get_embedddings();
        this.vectorStore = this.get_vectorstore();
    }

    get_client = async () => {
        const client: any = await createClient(
        {
            url: "redis://10.0.0.211:6379",
        }
        )
        .on('error', (err: any) => console.log('Redis Client Error', err))
        .connect();
        return client;
    }

    get_embedddings = () => {
        return new OllamaEmbeddings({
            model: "all-minilm",
            baseUrl: "http://10.0.0.211:11434", // default value
        });
    }

    get_vectorstore = async () => {
        const embeddings = this.embeddings;
        const vectorStore = await new RedisVectorStore(embeddings, {
        redisClient: await this.client,
        indexName: "docs",
        });
        return vectorStore;
    }

    get_retriever = () => {
        return this.vectorStore.asRetriever();
    }
}