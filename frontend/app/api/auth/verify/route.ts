import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { isEvmAddress } from "@/lib/types";
export const runtime="nodejs";
export async function POST(request:NextRequest){
  const limited=rateLimit(request,"auth-verify",10);if(limited)return limited;
  try{const body=await request.json();const address=String(body.address??""),message=String(body.message??""),nonce=String(body.nonce??""),signature=String(body.signature??"");if(!isEvmAddress(address)||message.length>2000||!nonce.match(/^[a-f0-9]{48}$/)||signature.length>300)return NextResponse.json({error:"Invalid sign-in request."},{status:400});const user=await verifyChallenge(address,message,nonce,signature);return NextResponse.json({authenticated:true,user},{headers:{"Cache-Control":"no-store"}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Signature verification failed."},{status:401})}
}
