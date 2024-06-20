import "reflect-metadata";
import { container } from "tsyringe";
import {Ollama } from "@langchain/community/llms/ollama";
import { ChatPromptTemplate} from "langchain/prompts";
import { pull } from "langchain/hub";

import { z } from "zod";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";


const bootstrap = async () => {


    const ollama = new Ollama({
        baseUrl: "http://10.0.0.211:11434/v1/chat/completions",
        model: "phi3"
    });

    const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You're a completion assistant. Given the part of a sentence and some context, try to complete the sentence using the context if possible. \n\nHere is the context:{context}",
    ],
    ["human", "{question}"],
    ]);

    container.register("main-llm", {
        useValue: ollama,
    });


    container.register("prompt", {
        useValue: prompt,
    });

    container.register("tools", {
        useValue: [],
    });

    return container;
}

export default bootstrap;