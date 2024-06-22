import { BaseChain } from "medpromptjs";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableMap, RunnablePassthrough, RunnableSequence, RunnableLambda } from "@langchain/core/runnables";

export class ChainService extends BaseChain {




    async Chain(input: any) {


        const output = RunnableSequence.from([
        new RunnablePassthrough(),
        this.tools[0],
        ]);
        return  output.invoke(input);
    }

}



