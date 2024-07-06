import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import api from 'zotero-api-client'

import bootstrap from "../bootstrap";
import { RedisRetreiver } from "../retreiver";

/*
GET https://api.zotero.org/users/userID/collections HTTP/1.1
Content-Type: application/json
Authorization: Bearer KeyHere

{}
*/
export async function POST(req: Request) {
  const sanitize = (text: string) => {
    return text.replace(/[^a-zA-Z0-9\s]/g, "");
  }

  // Zotero API
  const zotero = async (key : string, userid: string, collectionid: string) => {
    const response = await api(key).library('user', userid).collections(collectionid).items().get();
    let items = [];
    for (let i = 0; i < response.raw.length; i++) {
        if (!response.raw[i].data.title || !response.raw[i].data.abstractNote || !response.raw[i].data.creators[0]) {
            continue;
        }
        let authors = "";
        for (let j = 0; j < response.raw[i].data.creators.length; j++) {
            authors += response.raw[i].data.creators[j].lastName + ", " + response.raw[i].data.creators[j].firstName + "; ";
        }
        authors += "et al."
        let item = {
            title: response.raw[i].data.title + " by " + authors,
            content: response.raw[i].data.abstractNote || "",
        }
        console.log(response.raw[i].data);
        items.push(item);
    }
    return items;
  }

  ///

  try {
    const formData = await req.formData();
    const container = await bootstrap();
    const template = formData.get("index") as string || "";
    const redisRetriever = new RedisRetreiver(container, "", "", template); // Index name is sent through the template field (TODO: fix this)
    let zoteroCollection = formData.get("zotero") as string;
    if (!zoteroCollection) {
      zoteroCollection = container.resolve("zotero-collectionid");
    }
    let items: { title: string; content: any; }[] = [];
    try{
     items = await zotero(container.resolve("zotero-key"), container.resolve("zotero-userid"), zoteroCollection)
    }catch(e){
      console.log("Zotero Error"  + e)
    }
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 256, chunkOverlap: 20});
    for (const item of items) {
      const docs = await textSplitter.createDocuments([sanitize(item.content)]);
      for (const doc of docs) {
          doc.metadata.title =sanitize(item.title);
          doc.metadata.id = btoa(sanitize(item.title));
      }
      await redisRetriever.put_docs(docs);
    }

    revalidatePath("/");

    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

