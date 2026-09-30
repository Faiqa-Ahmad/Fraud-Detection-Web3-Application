import { NextRequest, NextResponse } from "next/server";
import { issueChallenge } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { isEvmAddress } from "@/lib/types";
export const runtime="nodejs";
export async function POST(request:NextRequest){
  const limited=rateLimit(request,"auth-nonce",10);if(limited)return limited;
  try{const {address}=await request.json();if(!isEvmAddress(String(address??"")))return NextResponse.json({error:"Enter a valid EVM address."},{status:400});return NextResponse.json(await issueChallenge(String(address),request.nextUrl.origin),{headers:{"Cache-Control":"no-store"}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not create sign-in request."},{status:503})}
}
