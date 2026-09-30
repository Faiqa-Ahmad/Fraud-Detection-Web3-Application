import pandas as pd
import numpy as np
from typing import List, Dict, Any

FEATURE_NAMES = ["transaction_count", "transaction_frequency", "avg_transfer_value", "max_transfer_value", "min_transfer_value", "unique_wallet_interactions", "contract_interaction_ratio", "token_transfer_count", "gas_spike_count", "avg_gas", "max_gas", "active_days", "outgoing_count", "incoming_count", "self_transfer_count", "unique_tokens", "time_between_tx_avg", "time_between_tx_std"]

def extract_features(transactions: List[Dict[str, Any]], wallet: str) -> Dict[str, float]:
    if not transactions: return {name: 0.0 for name in FEATURE_NAMES}
    wallet = wallet.lower(); values = np.array([max(0, float(t.get("value_eth", 0) or 0)) for t in transactions]); gas = np.array([max(0, float(t.get("gas", 0) or 0)) for t in transactions]); times = sorted(int(t.get("timestamp", 0) or 0) for t in transactions if t.get("timestamp")); diffs = np.diff(times) if len(times) > 1 else np.array([0]); days = max(1.0, (times[-1] - times[0]) / 86400) if times else 1.0
    peers=set(); tokens=set(); outgoing=incoming=self_count=contracts=token_count=0
    for tx in transactions:
        sender=str(tx.get("from_address", "")).lower(); receiver=str(tx.get("to_address", "")).lower()
        if sender == wallet: outgoing += 1
        if receiver == wallet: incoming += 1
        if sender and sender == receiver: self_count += 1
        peer = receiver if sender == wallet else sender
        if peer: peers.add(peer)
        if tx.get("is_contract_interaction"): contracts += 1
        if tx.get("token_symbol"): token_count += 1; tokens.add(str(tx["token_symbol"]))
    threshold = float(gas.mean() + 3 * gas.std())
    return {"transaction_count": float(len(transactions)), "transaction_frequency": float(len(transactions)/days), "avg_transfer_value": float(values.mean()), "max_transfer_value": float(values.max()), "min_transfer_value": float(values.min()), "unique_wallet_interactions": float(len(peers)), "contract_interaction_ratio": float(contracts/len(transactions)), "token_transfer_count": float(token_count), "gas_spike_count": float(np.sum(gas > threshold)), "avg_gas": float(gas.mean()), "max_gas": float(gas.max()), "active_days": float(days), "outgoing_count": float(outgoing), "incoming_count": float(incoming), "self_transfer_count": float(self_count), "unique_tokens": float(len(tokens)), "time_between_tx_avg": float(diffs.mean()), "time_between_tx_std": float(diffs.std())}

def build_feature_vector(features: Dict[str, float]) -> np.ndarray:
    return np.array([[float(features.get(name, 0)) for name in FEATURE_NAMES]])

