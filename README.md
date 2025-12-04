# Trap Stars - Collection Authority Management Toolkit

This toolkit contains everything you need to manage Metaplex Core NFT collection authorities and avoid the PDA trap that nearly destroyed your project.

## 📁 Files in This Package

1. **transfer-collection-authority.ts** - The working script to transfer update authority
2. **TRAIT_SHOP_ARCHITECTURE.md** - Complete guide to avoid the PDA problem in your trait shop
3. **README.md** - This file (usage guide)

---

## 🎯 What We Solved

**The Problem:**
- Your update authority wallet became a PDA (Program Derived Address)
- PDAs can't pay transaction fees or send SOL
- You were locked out of updating your collection

**The Solution:**
- Used `updateCollectionV1` from Metaplex Core SDK
- Set the NEW wallet as fee payer (bypassing PDA restrictions)
- Explicitly passed the CURRENT authority as signer
- Successfully transferred to a regular, non-PDA wallet

---

## 🚀 Quick Start: Transfer Authority for Any Collection

### Prerequisites

```bash
npm install @metaplex-foundation/umi-bundle-defaults \
            @metaplex-foundation/umi \
            @metaplex-foundation/mpl-core
```

### Usage

1. **Prepare your keypairs:**
   - `current-authority.json` - The wallet that currently controls the collection
   - `new-authority.json` - The wallet that will take over

2. **Update the script:**
   Open `transfer-collection-authority.ts` and change:
   ```typescript
   const COLLECTION_ADDRESS = "YOUR_COLLECTION_ADDRESS_HERE";
   ```

3. **Run it:**
   ```bash
   npx ts-node transfer-collection-authority.ts
   ```

4. **Verify:**
   Check on Solscan: `https://solscan.io/account/YOUR_COLLECTION_ADDRESS`

---

## 🏗️ Rebuilding Your Trait Shop (The Right Way)

**READ THIS BEFORE BUILDING:** `TRAIT_SHOP_ARCHITECTURE.md`

Key takeaways:
- **NEVER** make your update authority wallet into a PDA
- Use a SEPARATE PDA for trait shop data storage
- Keep authority as a regular keypair for signing

---

## 📝 The Winning Formula

Here's the exact code that worked:

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity } from '@metaplex-foundation/umi';
import { mplCore, updateCollectionV1 } from '@metaplex-foundation/mpl-core';

// 1. Load keypairs
const currentAuth = createSignerFromKeypair(umi, currentKeypair);
const newAuth = createSignerFromKeypair(umi, newKeypair);

// 2. Set NEW wallet as payer (critical for PDA authorities)
umi.use(signerIdentity(newAuth));

// 3. Transfer authority
await updateCollectionV1(umi, {
    collection: collectionAddress,
    authority: currentAuth,              // OLD authority signs
    newUpdateAuthority: newAuth.publicKey, // NEW authority address
}).sendAndConfirm(umi);
```

**Why it works:**
- `updateCollectionV1` - Collection-specific instruction (not `updateV1`)
- `authority: currentAuth` - Explicitly pass who's authorizing the change
- `signerIdentity(newAuth)` - New wallet pays fees (bypasses PDA restrictions)

---

## ⚠️ Important Notes

### For Metaplex Core Collections ONLY
This script works for **Metaplex Core** standard NFTs. If you're using the old **Token Metadata** standard, you need different instructions.

Check your collection type:
```bash
npx ts-node inspect-collection.ts
```

### Transaction Fees
- Costs ~0.000005 SOL (~$0.001 USD)
- Paid by the NEW authority wallet
- Make sure new wallet has a small amount of SOL

### Security
- **Backup your keypair files** before running
- Test on devnet first if possible
- The current authority will LOSE control after this runs
- This action is IRREVERSIBLE (but you can transfer back if needed)

### What Gets Transferred
- ✅ Ability to update NFT metadata
- ✅ Ability to mint new NFTs
- ✅ Ability to set royalties
- ❌ Does NOT transfer existing NFT ownership
- ❌ Does NOT affect treasury or fee wallets

---

## 🐛 Troubleshooting

### Error: "Invalid Authority"
- Your `current-authority.json` doesn't match the on-chain authority
- Run `inspect-collection.ts` to see who the real authority is

### Error: "Deserialization Error"
- Wrong collection address
- Collection has plugins that need additional accounts
- Using wrong SDK (Token Metadata vs Core)

### Error: "Insufficient funds"
- New authority wallet needs SOL for transaction fees
- Add at least 0.001 SOL

### Error: "Transfer: from must not carry data"
- This is the PDA problem (what we just fixed!)
- Use the NEW wallet as payer: `umi.use(signerIdentity(newAuth))`

---

## 📞 Support

If you run into issues:

1. Check the program logs in the error message
2. Verify collection address on Solscan
3. Confirm keypairs match expected addresses
4. Review `TRAIT_SHOP_ARCHITECTURE.md` for structural issues

---

## 🎉 Success Story

**Trap Stars Collection:** `5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i`

Successfully transferred from compromised PDA:
- **Old:** `27G5udze2GjVmZQS3XyHWHHBFfpuXZV4mpkNcHHxeeTK` (PDA - can't pay fees)
- **New:** `2uPRqodizBvVdCzD2sraN1jM8D9x3GvWd5LTrc31Y6aY` (Regular wallet - full control)

Status: ✅ Working perfectly!

---

## 📜 License

Use this however you want. If it saves your NFT project, that's payment enough! 🚀

---

**Made with frustration, determination, and eventually... success! 💪**
