import { NextResponse } from "next/server";
import { withRateLimit } from "../utils";
import bootstrap from "../bootstrap";
import { ChainService } from "./chain";
import { SelectionContext } from "~/app/types";

export const POST = withRateLimit(async (req) => {
    const { before, selection, after } = (await req.json()) as SelectionContext;


    const chain = await new ChainService(await bootstrap(), "", "", "");

    console.log("\n Suggestion: ", "before", before, "selection", selection, "after", after)

    // const outputText = [""]

    const _reply = await chain.Chain({
        before: before,
        after: after,
        selection: selection
    });

    const outputText = [_reply.replace("\n", "").replace(/\s\s+/g, ' ')]

    console.log("--COMPLETION_RAW_RESPONSE--");
    console.log(outputText);

    return NextResponse.json({
        completionText: outputText,
    });
});
