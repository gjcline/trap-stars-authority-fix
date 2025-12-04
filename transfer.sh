#!/bin/bash

# Metaplex Core Update Authority Transfer Script
# This uses the official Solana CLI tools if TypeScript approaches fail

echo "🚀 Metaplex Core Update Authority Transfer"
echo "=========================================="
echo ""

# Configuration
COLLECTION_ADDRESS="5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i"
PDA_WALLET="./pda-wallet.json"
NEW_WALLET="./new-wallet.json"
RPC_URL="https://api.mainnet-beta.solana.com"

# Check if wallet files exist
if [ ! -f "$PDA_WALLET" ]; then
    echo "❌ Error: $PDA_WALLET not found!"
    exit 1
fi

if [ ! -f "$NEW_WALLET" ]; then
    echo "❌ Error: $NEW_WALLET not found!"
    exit 1
fi

# Extract public keys
PDA_PUBKEY=$(solana-keygen pubkey "$PDA_WALLET" 2>/dev/null)
NEW_PUBKEY=$(solana-keygen pubkey "$NEW_WALLET" 2>/dev/null)

if [ -z "$PDA_PUBKEY" ] || [ -z "$NEW_PUBKEY" ]; then
    echo "❌ Error: Could not extract public keys from wallet files"
    echo "Make sure solana-keygen is installed"
    exit 1
fi

echo "Current Update Authority (PDA): $PDA_PUBKEY"
echo "New Update Authority: $NEW_PUBKEY"
echo "Collection: $COLLECTION_ADDRESS"
echo ""

# Check if metaboss is installed
if command -v metaboss &> /dev/null; then
    echo "✓ Found metaboss CLI"
    echo "📤 Attempting to update collection with metaboss..."
    
    # Metaboss update-authority command
    # Note: This is for Token Metadata, not Core - included for reference
    # metaboss update authority -k "$PDA_WALLET" -a "$COLLECTION_ADDRESS" --new-authority "$NEW_PUBKEY" --url "$RPC_URL"
    
    echo "⚠️  Note: metaboss doesn't support Metaplex Core collections yet"
    echo "    (it only supports Token Metadata standard)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Alternative: Use TypeScript/JavaScript"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run one of these commands:"
echo "  npx ts-node transfer-simple-umi.ts"
echo "  npx ts-node transfer-web3-clean.ts"
echo ""
echo "Or try the Python version:"
echo "  python3 transfer.py"
echo ""
