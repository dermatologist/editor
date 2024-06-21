import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

import { RedisRetreiver } from "../llmcompletion/retreiver";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const redisRetriever = new RedisRetreiver();
    const file = formData.get("file") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(`/tmp/${file.name}`, buffer);

    const loader = new PDFLoader(`/tmp/${file.name}`);

    const docs = await loader.load();
    await redisRetriever.put_docs(docs);
    console.log(docs)

    revalidatePath("/");

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}