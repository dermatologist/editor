import { NextResponse } from "next/server";

import { SelectionContext } from "~/app/types";

import bootstrap from "../bootstrap";
import { withRateLimit } from "../utils";
import { ChainService } from "./chain";

export const POST = withRateLimit(async (req) => {
    const { before, selection, after } = (await req.json()) as SelectionContext;


    const chain = await new ChainService(await bootstrap(), "", "", "");


    const _reply = await chain.Chain({
        input: selection
    });

    const outputText = JSON.parse(_reply)

    console.log("--SUGGESTION_RAW_RESPONSE--");
    console.log(outputText);
    /*
    [{"title":"Use of Artificial Intelligence in Dermatology - PMC","url":"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7640800/","content":"Machine learning is a subset of artificial intelligence (AI) in which computer programs learn automatically from experience without explicit programming instructions. [ 2] Dermatology has taken the pole position for the implementation of AI in medical field because of its large clinical, dermatoscopical, and dermatopathological image database.","score":0.98608,"raw_content":null}]
    */

    const suggestions = Array.from(new Set(outputText.map(
        (item: any) =>  selection + " [" + item.title + " | " + item.url + " | " + item.content.substring(0, 100) + "... | " + item.score + "] ")));

    console.log("--SUGGESTION_RESPONSE--");
    console.log(suggestions);
    return NextResponse.json(suggestions);
});
