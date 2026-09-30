import { NextRequest, NextResponse } from "next/server";

type Entry={count:number;resetAt:number};
const globalStore=globalThis as typeof globalThis&{sentinelRateLimits?:Map<string,Entry>};
const store=globalStore.sentinelRateLimits??=new Map<string,Entry>();

export function rateLimit(request:NextRequest,scope:string,limit:number,windowMs=60_000){
  const forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const client=forwarded||request.headers.get("x-real-ip")||"local";
  const key=`${scope}:${client}`;const now=Date.now();let entry=store.get(key);
  if(!entry||entry.resetAt<=now){entry={count:0,resetAt:now+windowMs};store.set(key,entry)}
  entry.count++;
  if(store.size>5000)for(const [storedKey,value] of store)if(value.resetAt<=now)store.delete(storedKey);
  if(entry.count<=limit)return null;
  const retryAfter=Math.max(1,Math.ceil((entry.resetAt-now)/1000));
  return NextResponse.json({error:"Too many requests. Please try again shortly."},{status:429,headers:{"Retry-After":String(retryAfter),"Cache-Control":"no-store"}});
}
