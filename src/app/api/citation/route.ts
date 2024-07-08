import { NextResponse } from "next/server";

import { SelectionContext } from "~/app/types";

import bootstrap from "../bootstrap";
import { withRateLimit } from "../utils";
import { CitationService } from "./chain";

export const POST = withRateLimit(async (req) => {
    const { before, selection, after } = (await req.json()) as SelectionContext;


    const chain = await new CitationService(await bootstrap(), "", "", "");


    const _reply = await chain.Chain({
        input: selection
    });

    const vectorstoreMatches = _reply[0].vectorstore.replace("\n", "").split(",,")
    console.log("--VECTORSTORE_RESPONSE--");
    console.log(vectorstoreMatches);
    const travility = _reply[0].travility;

    // Parse the travility response
    const outputText = JSON.parse(travility)

    // for loop to iterate over the vectorstoreMatches
    // and append the matches to the outputText
    for (let i = 0; i < vectorstoreMatches.length; i++) {
        const match = vectorstoreMatches[i].split(" - ");
        if(match.length < 2) continue;
        outputText.push({
            title: match[0],
            content: match[1],
            url: "",
            score: 1,
            raw_content: null,
        });
    }

    console.log("--SUGGESTION_RAW_RESPONSE--");
    console.log(outputText);
    /*
    [{"title":"Use of Artificial Intelligence in Dermatology - PMC","url":"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7640800/","content":"Machine learning is a subset of artificial intelligence (AI) in which computer programs learn automatically from experience without explicit programming instructions. [ 2] Dermatology has taken the pole position for the implementation of AI in medical field because of its large clinical, dermatoscopical, and dermatopathological image database.","score":0.98608,"raw_content":null}]
    */

    const suggestions = Array.from(new Set(outputText.map(
        (item: any) =>  " [" + item.title + " | " + item.url + " | " + item.content.substring(0, 50) + "... | " + item.score + "] ")));

    console.log("--SUGGESTION_RESPONSE--");
    console.log(suggestions);
    return NextResponse.json(suggestions);
});
