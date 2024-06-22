import { BaseChain } from "medpromptjs";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap, RunnablePassthrough, RunnableSequence, RunnableLambda } from "@langchain/core/runnables";

export class ChainService extends BaseChain {




    async Chain(input: any) {
        const search = RunnableSequence.from([{
            input: new RunnablePassthrough().pick("selection"),
        }, this.tools[0]]);

        const output = RunnableSequence.from([
        new RunnablePassthrough(),
        this.resolve("suggestion-prompt"),
        this.llm,
        new StringOutputParser(),
        ]);
        return  output.invoke(input);
    }

}



