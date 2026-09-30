import { NextResponse } from "next/server";
import { rpc } from "@/lib/blockchain";
import { databaseHealth } from "@/lib/database";
import { CHAINS, ChainId } from "@/lib/types";
export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 const checkedAt=new Date().toISOString();
 const chainEntries=Object.keys(CHAINS) as ChainId[];
 const [database,ai,...blocks]=await Promise.allSettled([
  databaseHealth(),
  fetch(`${process.env.PYTHON_AI_SERVICE_URL}/health`,{signal:AbortSignal.timeout(5000),cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("AI service unavailable");return response.json()}),
  ...chainEntries.map(async chain=>{const started=Date.now();const height=parseInt(await rpc<string>(chain,"eth_blockNumber",[]),16);return{chain,height,latencyMs:Date.now()-started}})
 ]);
 const networks=chainEntries.map((chain,index)=>blocks[index].status==="fulfilled"?blocks[index].value:{chain,height:null,latencyMs:null});
 const healthyNetworks=networks.filter(network=>network.height!==null).length;
 return NextResponse.json({checkedAt,overall:database.status==="fulfilled"&&ai.status==="fulfilled"&&healthyNetworks===chainEntries.length?"operational":"degraded",database:{ok:database.status==="fulfilled",latencyMs:database.status==="fulfilled"?database.value:null},ai:{ok:ai.status==="fulfilled"},networks,healthyNetworks,totalNetworks:chainEntries.length},{headers:{"Cache-Control":"no-store"}})
}
