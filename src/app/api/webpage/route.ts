import axios from "axios";
import { convert } from "html-to-text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import bootstrap from "../bootstrap";
import { RedisRetreiver } from "../retreiver";


export async function POST(req: Request) {
  const sanitize = (text: string) => {
    return text.replace(/[^a-zA-Z0-9\s]/g, "");
  }

  const getWebPage = async (url: string) => {
    let items = [];
    const response = await axios.get(url);
    const text = convert(response.data);
    const item = {
      title: url,
      content: text,
    }
    items.push(item);
    console.log(item);
    return items;
  }

  ///

  try {
    const formData = await req.formData();
    const container = await bootstrap();
    const indexName = formData.get("index") as string || "";
    const redisRetriever = new RedisRetreiver(container, "", "");
    let webPage = formData.get("webpage") as string;
    let items: { title: string; content: any; }[] = [];
    try{
     items = await getWebPage(webPage)
    } catch(e){
      console.log("Webpage Error"  + e)
    }
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 256, chunkOverlap: 20});
    for (const item of items) {
      const docs = await textSplitter.createDocuments([sanitize(item.content)]);
      for (const doc of docs) {
          doc.metadata.title =item.title;
          doc.metadata.id = btoa(sanitize(item.title));
      }
      await redisRetriever.put_docs(docs, indexName);
    }

    revalidatePath("/");

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

