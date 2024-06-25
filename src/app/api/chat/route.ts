import { NextResponse } from "next/server";
import { withRateLimit } from "../utils";
import bootstrap from "../bootstrap";
import { QAService } from "./chain";

export const POST = withRateLimit(async (req) => {
    const reader = req.body.getReader();
    let buffer = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value);
    }
    const messages = JSON.parse(buffer).messages;
    const last_message = messages[messages.length - 1];
    const question = last_message.content;
    console.log("chat input", question);

    const chain = await new QAService(await bootstrap(), "", "", "");

    const _reply = await chain.ragChain({question: question});

    const outputText = _reply.text.replace("\n", "").replace(/\s\s+/g, ' ') + "                                           " + _reply.context;

    console.log("--CHAT_RAW_RESPONSE--");
    console.log(outputText);

    return NextResponse.json({
        completionText: outputText,
    });
});
