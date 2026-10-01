import { NextRequest, NextResponse } from "next/server";
import { formatEther } from "ethers";
import { CHAINS, ChainId, Transaction, WalletAnalysis, isEvmAddress } from "@/lib/types";
import { rpc, fetchNativePrice, fetchTokenAssets, fetchTransfers } from "@/lib/blockchain";
import { saveAnalysis } from "@/lib/database";
import { rateLimit } from "@/lib/rate-limit";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
 const limited=rateLimit(request,"wallet-analysis",10);if(limited)return limited;
 try {
  const body=await request.json(); const address=String(body.address??body.wallet_address??""); const chain=String(body.chain??"ethereum") as ChainId;
  if(!isEvmAddress(address)) return NextResponse.json({error:"Enter a valid EVM address."},{status:400}); if(!CHAINS[chain]) return NextResponse.json({error:"Unsupported network."},{status:400});
  const [balanceHex,bytecode,raw,tokenAssets,nativePrice]=await Promise.all([rpc<string>(chain,"eth_getBalance",[address,"latest"]),rpc<string>(chain,"eth_getCode",[address,"latest"]),fetchTransfers(chain,address),fetchTokenAssets(chain,address),fetchNativePrice(chain)]);
  const transactions:Transaction[]=raw.map(tx=>({hash:tx.hash,from:tx.from,to:tx.to??"",value:tx.value??0,timestamp:tx.timestamp,status:"confirmed",type:tx.category==="erc721"||tx.category==="erc1155"?"nft":tx.category==="erc20"?"token":tx.category==="external"?"transfer":"contract",gas:0,risk:"safe"}));
  const aiUrl=process.env.PYTHON_AI_SERVICE_URL; if(!aiUrl) throw new Error("PYTHON_AI_SERVICE_URL is not configured");
  const aiTransactions=transactions.slice(0,1000);
  const txJson = JSON.stringify(aiTransactions.map(tx=>({tx_hash:tx.hash,from_address:tx.from,to_address:tx.to,value_eth:tx.value,gas:tx.gas,timestamp:tx.timestamp,is_contract_interaction:tx.type==="contract",token_symbol:tx.type==="token"?"TOKEN":null})));
  
  const { Client } = await import("@gradio/client");
  const client = await Client.connect(aiUrl);
  const aiResponse = await client.predict("/predict", [address, txJson]) as any;
  if (!aiResponse || !aiResponse.data || !aiResponse.data[0]) throw new Error("AI service returned invalid response");
  
  const ai = JSON.parse(aiResponse.data[0]);
  if (ai.error) throw new Error(`AI error: ${ai.error}`);
  
  const balance=Number(formatEther(BigInt(balanceHex)));
  const assets=[{symbol:CHAINS[chain].symbol,name:CHAINS[chain].name,balance,valueUsd:nativePrice?balance*nativePrice.usd:null,change24h:nativePrice?.change24h??null,kind:"token" as const},...tokenAssets];const portfolioValue=assets.reduce((sum,a)=>sum+(a.valueUsd??0),0);
  const result:WalletAnalysis={address,chain,balance,portfolioValue,transactionCount:transactions.length,uniqueInteractions:new Set(transactions.flatMap(tx=>[tx.from.toLowerCase(),tx.to.toLowerCase()]).filter(x=>x&&x!==address.toLowerCase())).size,activeDays:transactions.length?Math.max(1,Math.ceil((Date.now()/1000-Math.min(...transactions.map(tx=>tx.timestamp)))/86400)):0,risk:{score:ai.fraud_score.risk_score,level:ai.fraud_score.risk_level,confidence:ai.fraud_score.confidence,factors:ai.fraud_score.risk_factors},assets,transactions,activity:buildActivity(transactions),analyzedAt:new Date().toISOString(),source:"live",contract:{isContract:bytecode!=="0x",bytecodeBytes:Math.max(0,(bytecode.length-2)/2)}};
  if(body.persist!==false)await saveAnalysis(result,ai.features); return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 } catch(error){console.error("Live wallet analysis failed",error);return NextResponse.json({error:error instanceof Error?error.message:"Live analysis failed"},{status:502})}
}
function buildActivity(transactions:Transaction[]){const days=new Map<string,number>();for(let i=13;i>=0;i--){const d=new Date(Date.now()-i*86400000).toISOString().slice(5,10);days.set(d,0)}for(const tx of transactions){const d=new Date(tx.timestamp*1000).toISOString().slice(5,10);if(days.has(d))days.set(d,(days.get(d)??0)+1)}return [...days].map(([day,count])=>({day,transactions:count}))}
