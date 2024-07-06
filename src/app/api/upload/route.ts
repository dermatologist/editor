import fs from "node:fs/promises";

import AdmZip  from 'adm-zip';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {pdfToText} from 'pdf-ts';

import bootstrap from "../bootstrap";
import { RedisRetreiver } from "../retreiver";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const container = await bootstrap();
    const template = formData.get("index") as string || ""; // Index name is sent through the template field (TODO: fix this)
    const redisRetriever = new RedisRetreiver(container, "", "", template);
    const file = formData.get("file") as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    await fs.writeFile(`/tmp/${file.name}`, buffer);
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 256, chunkOverlap: 20});

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
              doc.metadata.id = btoa(zipEntry.entryName);
          }
          await redisRetriever.put_docs(docs);
          console.log(text);
        }
      }
    }else{
      const pdf = await fs.readFile(`/tmp/${file.name}`);
      const text = await pdfToText(pdf);
      const docs = await textSplitter.createDocuments([text]);
      for (const doc of docs) {
          doc.metadata.title = file.name;
          doc.metadata.id = btoa(file.name);
      }
      await redisRetriever.put_docs(docs);
      console.log(text);
    }

    revalidatePath("/");

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

