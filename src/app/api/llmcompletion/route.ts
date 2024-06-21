import { NextResponse } from "next/server";
import OpenAI from "openai";

import { SelectionContext } from "~/app/types";

import { withRateLimit } from "../utils";

import bootstrap from "./bootstrap";
import { ChainService } from "./chain";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Set the runtime to edge for best performance
export const runtime = "edge";

export const POST = withRateLimit(async (req) => {
    const { text } = await req.json();

    console.log("completion input", text);

    const _system = `You are a text completion agent. `;
    const _user = `Complete the following text.
            Make sure the what you write works in the context of the text.
            No special characters. No assistant annotation.
            If there is an incomplete word, complete the word.

            text: ${text} `
    const chain = await new ChainService(await bootstrap(), "main-llm", "prompt", "tools");

    const _reply = await chain.chain({'question': _system + _user})

    const outputText = _reply.replace("\n", "").replace(/\s\s+/g, ' ');

    console.log("--COMPLETION_RAW_RESPONSE--");
    console.log(outputText);

    return NextResponse.json({
        completionText: outputText,
    });
});
