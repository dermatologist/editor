import { NextResponse } from "next/server";
import bootstrap from "../bootstrap";


export async function POST(req: Request) {
  ///

  try {
    const formData = await req.formData();
    const container = await bootstrap();
    const indexName = formData.get("index") as string || "";
    container.register("index-name", {
        useValue: indexName,
    });
    return NextResponse.json({ status: "success" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "fail", error: e });
  }
}

