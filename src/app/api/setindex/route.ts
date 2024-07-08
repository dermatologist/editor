import "reflect-metadata";

import { RedisVectorStore } from "@langchain/redis";
import { NextResponse } from "next/server";
import { createClient } from "redis";

import bootstrap from "../bootstrap";


export async function POST(req: Request) {
  ///

  try {
    const formData = await req.formData();
    const container = await bootstrap();
    const indexName = formData.get("index") as string || "";
    container.clearInstances();
    container.register("index-name", {
        useValue: indexName,
    });
    const redis_client: any = await createClient(
        {
            url: process.env.NEXT_PUBLIC_REDIS_URL || "redis://localhost:6379",
        }
        )
        .on('error', (err: any) => console.log('Redis Client Error', err))
    .connect();
    const vectorstore = await new RedisVectorStore(container.resolve("embedding"), {
        redisClient: await redis_client,
        indexName: indexName,
    });
    container.register("vectorstore", {
        useValue: vectorstore,
    });
    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

