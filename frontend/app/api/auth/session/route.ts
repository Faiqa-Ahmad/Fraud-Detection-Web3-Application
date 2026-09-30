import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
export const runtime="nodejs";
export async function GET(){const user=await getCurrentUser();return NextResponse.json({authenticated:Boolean(user),user},{headers:{"Cache-Control":"no-store"}})}
