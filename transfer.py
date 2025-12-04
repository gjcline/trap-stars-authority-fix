#!/usr/bin/env python3
"""
Update Authority Transfer Script using Python + Solana libraries
Install: pip install solders solana anchorpy
"""

import json
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.instruction import Instruction, AccountMeta
from solders.hash import Hash
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed
from solana.transaction import Transaction as LegacyTransaction

# Constants
MPL_CORE_PROGRAM_ID = Pubkey.from_string("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d")
COLLECTION_ADDRESS = Pubkey.from_string("5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i")
RPC_URL = "https://api.mainnet-beta.solana.com"

# UpdateV1 discriminator
UPDATE_V1_DISCRIMINATOR = bytes([0x32, 0xc2, 0x9a, 0x1e, 0x7b, 0x4f, 0x1e, 0x3a])

def load_keypair(filepath: str) -> Keypair:
    """Load keypair from JSON file"""
    with open(filepath, 'r') as f:
        secret = json.load(f)
    return Keypair.from_bytes(bytes(secret))

def main():
    print("🚀 Starting Update Authority Transfer (Python approach)...")
    
    # Load wallets
    pda_keypair = load_keypair('./pda-wallet.json')
    new_keypair = load_keypair('./new-wallet.json')
    
    print("\n--- Configuration ---")
    print(f"Current Update Authority (PDA): {pda_keypair.pubkey()}")
    print(f"New Update Authority: {new_keypair.pubkey()}")
    print(f"Payer: {new_keypair.pubkey()}")
    print(f"Collection: {COLLECTION_ADDRESS}")
    
    # Build instruction data
    # Format: discriminator + field_present (1 byte) + variant (1 byte) + pubkey (32 bytes)
    instruction_data = (
        UPDATE_V1_DISCRIMINATOR +
        bytes([0x01]) +  # UpdateAuthority field present
        bytes([0x00]) +  # Address variant (not Collection)
        bytes(new_keypair.pubkey())
    )
    
    # Build instruction accounts
    accounts = [
        AccountMeta(pubkey=COLLECTION_ADDRESS, is_signer=False, is_writable=True),
        AccountMeta(pubkey=pda_keypair.pubkey(), is_signer=True, is_writable=False),
        AccountMeta(pubkey=new_keypair.pubkey(), is_signer=False, is_writable=False),
    ]
    
    # Create instruction
    instruction = Instruction(
        program_id=MPL_CORE_PROGRAM_ID,
        accounts=accounts,
        data=instruction_data
    )
    
    # Connect and send
    client = Client(RPC_URL, commitment=Confirmed)
    
    print("\n📤 Fetching recent blockhash...")
    recent_blockhash = client.get_latest_blockhash().value.blockhash
    
    # Build transaction
    transaction = Transaction.new_with_payer(
        instructions=[instruction],
        payer=new_keypair.pubkey(),
    )
    
    # Sign transaction
    transaction.partial_sign([new_keypair, pda_keypair], recent_blockhash)
    
    print("📤 Sending transaction...")
    result = client.send_transaction(transaction, opts={"skip_preflight": False})
    signature = result.value
    
    print(f"\n✅ SUCCESS! Transaction sent.")
    print(f"Signature: {signature}")
    print(f"View on Solscan: https://solscan.io/tx/{signature}")
    
    # Wait for confirmation
    print("\n⏳ Waiting for confirmation...")
    client.confirm_transaction(signature, commitment=Confirmed)
    print("✅ Transaction confirmed!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
