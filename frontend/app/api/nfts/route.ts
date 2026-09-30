import { NextRequest, NextResponse } from "next/server";
import { fetchNfts } from "@/lib/blockchain";
import { CHAINS, ChainId, isEvmAddress } from "@/lib/types";
export const runtime="nodejs";
export async function GET(request:NextRequest){try{const url=new URL(request.url);const address=url.searchParams.get("address")??"";const chain=(url.searchParams.get("chain")??"") as ChainId;if(!isEvmAddress(address)||!CHAINS[chain])return NextResponse.json({error:"Invalid address or chain"},{status:400});return NextResponse.json(await fetchNfts(chain,address))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"NFT lookup failed"},{status:502})}}
