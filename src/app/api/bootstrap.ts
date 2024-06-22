import "reflect-metadata";
import { container } from "tsyringe";
import {Ollama } from "@langchain/community/llms/ollama";
import { ChatPromptTemplate} from "langchain/prompts";
import { pull } from "langchain/hub";

import { z } from "zod";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";


const bootstrap = async () => {

    const ollama = new Ollama({
        baseUrl: "http://10.0.0.211:11434",
        model: "phi3"
    });

    const suggestion_prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You're a text improvement agent. Please suggest improvements for only the text between the square brackets from the human below. ",
    ],
    ["human", `{before}{selection}{after}`],
    ]);

    const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You're a completion assistant. Given the part of a sentence and some context, try to complete the sentence using the context if possible. \n\nHere is the context:{context}. If context is not relevant use your own knowledge to complete",
    ],
    ["human", "{question}"],
    ]);

    // Define the tools the agent will have access to.
    const tools = [new TavilySearchResults({ maxResults: 1, apiKey: process.env.NEXT_PUBLIC_TAVILY_KEY })];

    container.register("main-llm", {
        useValue: ollama,
    });


    container.register("prompt", {
        useValue: prompt,
    });

    container.register("suggestion-prompt", {
        useValue: suggestion_prompt,
    });

    container.register("tools", {
        useValue: tools,
    });

    return container;
}

export default bootstrap;