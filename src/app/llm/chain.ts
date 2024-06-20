import { BaseChain } from "medpromptjs";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap, RunnablePassthrough } from "@langchain/core/runnables";
import { RedisRetreiver } from "./retriever";

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

    //     // Override
    async ragChain(input: any) {
        // subchain for generating an answer once we've done retrieval
        const answerChain = this.prompt.pipe(this.llm).pipe(new StringOutputParser());
        const map = RunnableMap.from({
            question: new RunnablePassthrough(),
            docs: await new RedisRetreiver().get_client(),
        });
        // complete chain that calls the retriever -> formats docs to string -> runs answer subchain -> returns just the answer and retrieved docs.
        const _chain = map
        .assign({ context: this.formatDocs })
        .assign({ answer: answerChain })
        .pick(["answer", "docs"]);
        return _chain.invoke(input);
    }


}