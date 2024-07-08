import "reflect-metadata";

import { RedisVectorStore } from "@langchain/redis";
import { NextResponse } from "next/server";
import { createClient } from "redis";

import bootstrap from "../bootstrap";


export async function POST(req: Request) {
  ///

  try {
    const formData = await req.formData();
    const indexName = formData.get("index") as string || "";
    const container = await bootstrap(indexName);
    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

