import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {pdfToText} from 'pdf-ts';
import AdmZip  from 'adm-zip';
import bootstrap from "../bootstrap";
import { RedisVectorStore } from "@langchain/redis";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const container:any = await bootstrap();
    const embedding = container.resolve("embedding");
    const client = container.resolve("client");
    const file = formData.get("file") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(`/tmp/${file.name}`, buffer);
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 10});

    if (file.name.endsWith(".zip")) {
      const zip = new AdmZip(`/tmp/${file.name}`);
      zip.extractAllTo("/tmp/editor-docs", true);
      const zipEntries = zip.getEntries();
      for (const zipEntry of zipEntries) {
        if (zipEntry.entryName.endsWith(".pdf") && !zipEntry.entryName.startsWith("__")) {
          console.log(zipEntry.entryName);
          const pdf = zipEntry.getData();
          const text = await pdfToText(pdf);
          const docs = await textSplitter.createDocuments([text]);
          for (const doc of docs) {
              doc.metadata.title = zipEntry.entryName;
          }
          const vectorStore = await RedisVectorStore.fromDocuments(
            docs,
            embedding,
            {
                redisClient: await client,
                indexName: "testdocs",
            }
            );
            console.log(text);
          }
      }
    }else{
      const pdf = await fs.readFile(`/tmp/${file.name}`);
      const text = await pdfToText(pdf);
      const docs = await textSplitter.createDocuments([text]);
      for (const doc of docs) {
          doc.metadata.title = file.name;
      }
      const vectorStore = await RedisVectorStore.fromDocuments(
            docs,
            embedding,
            {
                redisClient: await client,
                indexName: "testdocs",
            }
      );
      console.log(text);
    }

    revalidatePath("/");

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

