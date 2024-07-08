import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import bootstrap from "../bootstrap";
import { withRateLimit } from "../utils";
import { ChainService } from "./chain";

const getChain = async (text: string) => {
    const chain = await new ChainService(await bootstrap(), "", "", "");
    return chain.ragChain({'question': text});
}

const getCachedChain = unstable_cache(
    async (text: string) => getChain(text),
    ['chain-response'],
    {revalidate: 300}
);

export const POST = withRateLimit(async (req) => {
    const { text } = await req.json();

    console.log("completion input", text);

    // const chain = await new ChainService(await bootstrap(), "", "", "");

    const _reply = await getCachedChain(text);

    const outputText = _reply.text.replace("\n", "").replace(/\s\s+/g, ' ') + _reply.context;

    console.log("--COMPLETION_RAW_RESPONSE--");
    console.log(outputText);

    return NextResponse.json({
        completionText: outputText,
    });
});
