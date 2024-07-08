import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableLambda,RunnableMap, RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { BaseChain } from "medpromptjs";

import { ChainService } from "../llmcompletion/chain";
export class CitationService extends BaseChain {

    chainService: ChainService;

    constructor(container: any, name: string, description: string, template: string="") {
        super(container, name, description, template);
        this.chainService = new ChainService(container, "", "", "");
    }

    async Chain(input: any) {

        const _input = new RunnablePassthrough().assign(
        {
            question: new RunnablePassthrough().pick("input"),
        }
        );

        const _context = _input.pipe(this.chainService.newRetreiver).pipe(this.chainService.formatDocs);

        const output = RunnableSequence.from([
        new RunnablePassthrough(),
        this.tools[0],
        ]);

        const _chain = RunnableMap.from([
        {
            vectorstore: _context,
            travility: output,
        },
        ]);
        return  _chain.invoke(input);
    }

}



