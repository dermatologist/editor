import { NextResponse } from "next/server";

import { SelectionContext } from "~/app/types";

import bootstrap from "../bootstrap";
import { withRateLimit } from "../utils";
import { ChainService } from "./chain";

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

    const outputText = _reply

    console.log("--SUGGESTION_RAW_RESPONSE--");
    console.log(outputText);

    const suggestions = Array.from(
        new Set(
            outputText.split("\n").flatMap((suggestion) => {
                let match = suggestion.match(/\[(.*?)\]/);
                const result = (match ? match[1] : suggestion.replace("- ", ""))
                    .trim()
                    .replace("\\n", "\n");

                if (result && result !== selection) {
                    return result;
                }

                return [];
            })
        )
    );

    return NextResponse.json(suggestions);
});
