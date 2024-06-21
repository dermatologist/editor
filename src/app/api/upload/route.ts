import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RedisRetreiver } from "../llmcompletion/retreiver";
import {pdfToText} from 'pdf-ts';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const redisRetriever = new RedisRetreiver();
    const file = formData.get("file") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(`/tmp/${file.name}`, buffer);
    const pdf = await fs.readFile(`/tmp/${file.name}`);
    const text = await pdfToText(pdf);
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 10});
    const docs = await textSplitter.createDocuments([text]);
    for (const doc of docs) {
        doc.metadata.title = file.name;
    }
    await redisRetriever.put_docs(docs);
    console.log(text);

    revalidatePath("/");

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}