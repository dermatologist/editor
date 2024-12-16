import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const withRateLimit =
    (handler: (req: Request, res: Response) => Promise<NextResponse>) =>
    async (req: Request, res: Response) => {
        if (
            // If process.env.NEXT_PUBLIC_LLM is gemini
            process.env.NEXT_PUBLIC_LLM === "gemini" 
        ) {
            const ip = req.headers.get("x-forwarded-for");
            const ratelimit = new Ratelimit({
                redis: kv,
                // 5 requests per 60 seconds
                limiter: Ratelimit.slidingWindow(5, "60 s"),
            });

            const { success, limit, reset, remaining } = await ratelimit.limit(
                `ratelimit_${ip}`
            );

            if (!success) {
                console.log("Rate limit exceeded, returning 429...");
                return new Response(
                    "Rate limit exceeded, please try again later.",
                    {
                        status: 429,
                        headers: {
                            "X-RateLimit-Limit": limit.toString(),
                            "X-RateLimit-Remaining": remaining.toString(),
                            "X-RateLimit-Reset": reset.toString(),
                        },
                    }
                );
            }
        }

        return handler(req, res);
    };
