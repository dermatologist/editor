import { RedisVectorStore } from "@langchain/redis";

export class RedisRetreiver {

    container: any;
    client: any;
    embeddings: any;
    vectorStore: any;

    constructor(container: any) {
        this.container = container;
        this.client = container.resolve("redis-client") || null;
        this.embeddings = container.resolve("embeddings") || null;
        this.vectorStore = container.resolve("vectorstore") || null;
    }

    put_docs = async (docs: any) => {
        const embeddings = this.embeddings;
        const vectorStore = await RedisVectorStore.fromDocuments(
        docs,
        embeddings,
        {
            redisClient: await this.client,
            indexName: "docs",
        }
        );
        return vectorStore;
    }

    get_vectorstore = async () => {
        if (!this.vectorStore) {
        throw new Error("No vector store found");
        }
        return this.vectorStore;
    }

    get_retriever = async () => {
        if (!this.vectorStore) {
        throw new Error("No vector store found");
        }
        return this.vectorStore.asRetriever();
    }
}