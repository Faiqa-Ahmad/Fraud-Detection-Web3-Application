import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { verifyMessage } from "ethers";
import { createLoginChallenge, createUserSession, deleteUserSession, findUserSession, consumeLoginChallenge } from "./database";

const COOKIE_NAME = "sentinel_session";
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const digest = (value:string) => createHash("sha256").update(value).digest("hex");

export async function issueChallenge(walletAddress:string, origin:string){
  const address=walletAddress.toLowerCase();
  const nonce=randomBytes(24).toString("hex");
  const issuedAt=new Date();
  const expiresAt=new Date(issuedAt.getTime()+10*60*1000);
  const message=[
    "Sentinel3 wants you to sign in with your Ethereum account:",address,"",
    "Sign in to access your private Sentinel3 watchlist. This request will not trigger a blockchain transaction.","",
    `URI: ${origin}`,"Version: 1","Chain ID: 1",`Nonce: ${nonce}`,`Issued At: ${issuedAt.toISOString()}`,`Expiration Time: ${expiresAt.toISOString()}`,
  ].join("\n");
  await createLoginChallenge(address,digest(nonce),message);
  return {message,nonce,expiresAt:expiresAt.toISOString()};
}

export async function verifyChallenge(address:string,message:string,nonce:string,signature:string){
  const normalized=address.toLowerCase();
  const recovered=verifyMessage(message,signature).toLowerCase();
  if(recovered!==normalized)throw new Error("The signature does not match this wallet.");
  if(!await consumeLoginChallenge(normalized,digest(nonce),message))throw new Error("This sign-in request is invalid, expired, or already used.");
  const token=randomBytes(32).toString("base64url");
  const user=await createUserSession(normalized,digest(token));
  const jar=await cookies();
  jar.set(COOKIE_NAME,token,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",maxAge:SESSION_SECONDS});
  return user;
}

export async function getCurrentUser(){
  const token=(await cookies()).get(COOKIE_NAME)?.value;
  return token?findUserSession(digest(token)):null;
}

export async function signOut(){
  const jar=await cookies();
  const token=jar.get(COOKIE_NAME)?.value;
  if(token)await deleteUserSession(digest(token));
  jar.delete(COOKIE_NAME);
}
