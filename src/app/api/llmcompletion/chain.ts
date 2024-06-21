import { BaseChain } from "medpromptjs";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap, RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { RedisRetreiver } from './retreiver'

export class ChainService extends BaseChain {



    // ref: https://js.langchain.com/v0.1/docs/use_cases/question_answering/citations/
    /**
 * Format the documents into a readable string.
 */
    formatDocs = (input: Record<string, any>): string => {
        const { docs } = input;
        return (
            "\n\n" +
            docs
            .map(
                (doc: Document) =>
                `Article title: ${doc.metadata.title}\nArticle Snippet: ${doc.pageContent}`
            )
            .join("\n\n")
        );
    };


    async ragChain(input: any) {
        const chain = RunnableSequence.from([
        {
            context: (await new RedisRetreiver().get_vectorstore()).asRetriever(),
            question: new RunnablePassthrough(),
        },
        this.prompt,
        this.llm,
        new StringOutputParser(),
        ]);
        return  chain.invoke(input);
    }

}



