import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
export const runtime="nodejs";
export async function POST(){await signOut();return NextResponse.json({authenticated:false},{headers:{"Cache-Control":"no-store"}})}
