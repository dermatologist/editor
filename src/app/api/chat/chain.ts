import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda,RunnableMap, RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { BaseChain } from "medpromptjs";

import { RedisRetreiver } from '../retreiver'

export class QAService extends BaseChain {

    // ref: https://js.langchain.com/v0.1/docs/use_cases/question_answering/citations/
    /**
    * Format the documents into a readable string.
    */
    formatDocs = (input: Record<string, any>): string => {
        const { docs } = input;
        const output = (
            "\n\n" +
            docs
            .map(
                (doc: Document) =>
                `<br /> * ${doc.metadata.title} - ${doc.pageContent}`
            )
            .join("\n\n")
        );
        console.log(output);
        return output;
    };

    newRetreiver = async (ques: any) => {
        try {
            const vectorstore = await new RedisRetreiver(this.container, "", "").get_vectorstore();
            const documents = await vectorstore.similaritySearch(ques.question, 5);
            let context: Document[] = [];
            // Remove duplicate documents
            const uniqueDocs = new Set();
            for (const doc of documents) {
                if (!uniqueDocs.has(doc.pageContent)) {
                    uniqueDocs.add(doc.pageContent);
                    context.push(doc);
                }
            }
            return {docs: context};
        } catch (error) {
            console.log(error)
            const d  = new Document({
                metadata: {
                    title: "",
                },
                pageContent: ques.question,
            });
            return {docs: [d]};
        }
    }


    async ragChain(input: any) {
        const _context = new RunnablePassthrough().pipe(this.newRetreiver).pipe(this.formatDocs);
        const chain = RunnableSequence.from([
        {
            context: _context,
            question: new RunnablePassthrough().pick("question"),
        },
        this.container.resolve("rag-prompt"),
        this.llm,
        new StringOutputParser(),
        ]);
        const output = RunnableMap.from({
            text: chain,
            context: _context
        })
        return  output.invoke(input);
    }

}



