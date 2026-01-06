import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import bootstrap from "../bootstrap";
import { withRateLimit } from "../utils";
import { SentenceChainService } from "./chain";

const getSentences = async (text: string, llm?: string) => {
    const container = await bootstrap("", llm);
    const chain = new SentenceChainService(container);
    return chain.sentenceChain({'question': text});
}

export const POST = withRateLimit(async (req) => {
    const { text, llm } = await req.json();

    console.log("sentence generation input", text, "llm:", llm);

    const _reply = await getSentences(text, llm);

    const outputText = _reply.text.replace(/\s\s+/g, ' ');

    console.log("--SENTENCE_GENERATION_RESPONSE--");
    console.log(outputText);

    return NextResponse.json({
        sentences: outputText,
    });
});
