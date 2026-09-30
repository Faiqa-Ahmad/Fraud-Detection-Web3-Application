import { NextResponse } from "next/server";
import { listRecentAnalyses } from "@/lib/database";
export const runtime="nodejs";
export async function GET(){try{return NextResponse.json(await listRecentAnalyses())}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Database error"},{status:503})}}
