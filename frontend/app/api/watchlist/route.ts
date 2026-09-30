import { NextRequest, NextResponse } from "next/server";
import { addWatch, deleteWatch, listWatchlist } from "@/lib/database";
import { CHAINS, ChainId, isEvmAddress } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
export const runtime="nodejs";
const unauthorized=()=>NextResponse.json({error:"Sign in with your wallet to use your private watchlist."},{status:401});
export async function GET(){try{const user=await getCurrentUser();if(!user)return unauthorized();return NextResponse.json(await listWatchlist(user.id))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Database error"},{status:503})}}
export async function POST(request:NextRequest){try{const user=await getCurrentUser();if(!user)return unauthorized();const body=await request.json();const address=String(body.address??"");const chain=String(body.chain??"") as ChainId;if(!isEvmAddress(address)||!CHAINS[chain])return NextResponse.json({error:"Invalid address or chain"},{status:400});return NextResponse.json(await addWatch(user.id,address,chain,String(body.label??"").slice(0,120)||undefined),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Database error"},{status:503})}}
export async function DELETE(request:NextRequest){try{const user=await getCurrentUser();if(!user)return unauthorized();const id=new URL(request.url).searchParams.get("id");if(!id)return NextResponse.json({error:"Missing id"},{status:400});await deleteWatch(user.id,id);return new NextResponse(null,{status:204})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Database error"},{status:503})}}
