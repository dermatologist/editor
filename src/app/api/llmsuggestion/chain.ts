import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda,RunnableMap, RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { BaseChain } from "medpromptjs";

export class ChainService extends BaseChain {




    async Chain(input: any) {
        const search = RunnableSequence.from([{
            input: new RunnablePassthrough().pick("selection"),
        }, this.tools[0]]);

        const vars = RunnableMap.from({
            search: search,
            before: new RunnablePassthrough().pick("before"),
            after: new RunnablePassthrough().pick("after"),
            selection: new RunnablePassthrough().pick("selection"),
        });

        const output = RunnableSequence.from([
        vars,
        this.resolve("suggestion-prompt"),
        this.llm,
        new StringOutputParser(),
        ]);
        return  output.invoke(input);
    }

}



