import { NextResponse } from "next/server";
import { withRateLimit } from "../utils";
import bootstrap from "./bootstrap";
import { ChainService } from "./chain";

export const POST = withRateLimit(async (req) => {
    const { text } = await req.json();

    console.log("completion input", text);

    const chain = await new ChainService(await bootstrap(), "", "", "");

    const _reply = await chain.ragChain({'question': text})

    const outputText = _reply.text.replace("\n", "").replace(/\s\s+/g, ' ') + _reply.context;

    console.log("--COMPLETION_RAW_RESPONSE--");
    console.log(outputText);

    return NextResponse.json({
        completionText: outputText,
    });
});
