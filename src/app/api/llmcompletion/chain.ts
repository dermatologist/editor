import { BaseChain } from "medpromptjs";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap, RunnablePassthrough, RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { RedisRetreiver } from './retreiver'

export class ChainService extends BaseChain {



    // ref: https://js.langchain.com/v0.1/docs/use_cases/question_answering/citations/
    /**
 * Format the documents into a readable string.
 */
    formatDocs = (input: Record<string, any>): string => {
        console.log(input)
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

    newRetreiver = async (ques: any) => {
        try {
            const retreiver = await new RedisRetreiver().get_vectorstore();
            const context = await retreiver.similaritySearch(ques.question, 5);
            return {docs: context};
        } catch (error) {
            console.log(error)
            const d  = new Document({
                metadata: {
                    title: "Error",
                },
                pageContent: "Error in getting context",
            });
            return {docs: [d]};
        }
    }


    async ragChain(input: any) {
        const chain = RunnableSequence.from([
        {
            context: new RunnablePassthrough().pipe(this.newRetreiver).pipe(this.formatDocs),
            question: new RunnablePassthrough(),
        },
        this.prompt,
        this.llm,
        new StringOutputParser(),
        ]);
        return  chain.invoke(input);
    }

}



