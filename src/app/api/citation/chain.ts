import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda,RunnableMap, RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { BaseChain } from "medpromptjs";

export class CitationService extends BaseChain {




    async Chain(input: any) {


        const output = RunnableSequence.from([
        new RunnablePassthrough(),
        this.tools[0],
        ]);
        return  output.invoke(input);
    }

}



