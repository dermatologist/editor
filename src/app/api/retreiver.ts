import { RedisVectorStore } from "@langchain/redis";
import { BaseChain } from "medpromptjs";

export class RedisRetreiver extends BaseChain{


    put_docs = async (docs: any) => {
        if(docs.length > 0){
            const embedding = this.resolve("embedding");
            const vectorStore = await RedisVectorStore.fromDocuments(
            docs,
            embedding,
            {
                redisClient: await this.resolve("redis-client"),
                indexName: this.resolve("index-name"),
            }
            );
            return vectorStore;
        }else{
            console.log("No docs to put")
            return true;
        }
    }

    get_vectorstore = async () => {
        if (!this.resolve("vectorstore")) {
        throw new Error("No vector store found");
        }
        return this.resolve("vectorstore");
    }

    get_retriever = async () => {
        if (!this.resolve("vectorstore")) {
        throw new Error("No vector store found");
        }
        return this.resolve("vectorstore").asRetriever();
    }
}