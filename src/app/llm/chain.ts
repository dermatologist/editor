// import { BaseChain } from "medpromptjs";
import { BaseChain } from "node_modules/medpromptjs/dist/medpromptjs.cjs.production.min.js";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap, RunnablePassthrough } from "@langchain/core/runnables";
import { vectorStoreAsRetriever } from "./retriever";

export class Chain extends BaseChain {

    container: any;
    retreiver: any;
    constructor(container:any) {
        super(container, "rag_chain", "RAG Chain");
        this.container = container;
        this.retreiver = container.resolve("rag_chain_retreiver");
    }

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


    // Override
    chain(input: any) {
        // subchain for generating an answer once we've done retrieval
        const answerChain = this.prompt.pipe(this.llm).pipe(new StringOutputParser());
        const map = RunnableMap.from({
            question: new RunnablePassthrough(),
            docs: vectorStoreAsRetriever,
        });
        // complete chain that calls the retriever -> formats docs to string -> runs answer subchain -> returns just the answer and retrieved docs.
        const _chain = map
        .assign({ context: this.formatDocs })
        .assign({ answer: answerChain })
        .pick(["answer", "docs"]);
        return _chain.invoke(input);
    }
}