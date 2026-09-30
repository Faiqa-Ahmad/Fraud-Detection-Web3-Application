export type ChainId = "ethereum" | "polygon" | "arbitrum" | "optimism" | "bnb";

export interface ChainConfig { id: ChainId; name: string; symbol: string; explorer: string; color: string; chainIdHex: string; rpcUrl: string }
export const CHAINS: Record<ChainId, ChainConfig> = {
  ethereum: { id: "ethereum", name: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io", color: "#627eea", chainIdHex:"0x1", rpcUrl:"https://ethereum-rpc.publicnode.com" },
  polygon: { id: "polygon", name: "Polygon", symbol: "POL", explorer: "https://polygonscan.com", color: "#8247e5", chainIdHex:"0x89", rpcUrl:"https://polygon-bor-rpc.publicnode.com" },
  arbitrum: { id: "arbitrum", name: "Arbitrum", symbol: "ETH", explorer: "https://arbiscan.io", color: "#28a0f0", chainIdHex:"0xa4b1", rpcUrl:"https://arbitrum-one-rpc.publicnode.com" },
  optimism: { id: "optimism", name: "Optimism", symbol: "ETH", explorer: "https://optimistic.etherscan.io", color: "#ff0420", chainIdHex:"0xa", rpcUrl:"https://optimism-rpc.publicnode.com" },
  bnb: { id: "bnb", name: "BNB Chain", symbol: "BNB", explorer: "https://bscscan.com", color: "#f3ba2f", chainIdHex:"0x38", rpcUrl:"https://bsc-rpc.publicnode.com" },
};
export interface Transaction { hash: string; from: string; to: string; value: number; timestamp: number; status: "confirmed" | "failed"; type: "transfer" | "contract" | "token" | "nft"; gas: number; risk: "safe" | "warning" | "danger" }
export interface Asset { symbol: string; name: string; balance: number; valueUsd: number | null; change24h: number | null; kind: "token" | "nft"; contractAddress?: string }
export interface WatchItem { id: string; address: string; chain: ChainId; label: string | null; createdAt: string }
export interface TokenApproval { tokenAddress: string; tokenSymbol: string; spender: string; allowance: string; unlimited: boolean }
export interface NftAsset { contractAddress: string; tokenId: string; name: string; collection: string; imageUrl: string | null; tokenType: string }
export interface ScanHistory { id: string; address: string; chain: ChainId; riskScore: number; riskLevel: RiskResult["level"]; confidence: number; analyzedAt: string }
export interface RiskResult { score: number; level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; confidence: number; factors: string[] }
export interface WalletAnalysis { address: string; chain: ChainId; balance: number; portfolioValue: number; transactionCount: number; uniqueInteractions: number; activeDays: number; risk: RiskResult; assets: Asset[]; transactions: Transaction[]; activity: Array<{ day: string; transactions: number }>; analyzedAt: string; source: "live"; contract: { isContract: boolean; bytecodeBytes: number } }
export const isEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);
