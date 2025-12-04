# 🚀 QUICK REFERENCE: Transfer Metaplex Core Collection Authority

## One-Command Solution

```bash
# 1. Install dependencies (one time)
npm install @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/umi @metaplex-foundation/mpl-core

# 2. Create transfer-authority.ts with the code below

# 3. Update COLLECTION_ADDRESS in the file

# 4. Run it
npx ts-node transfer-authority.ts
```

---

## The Complete Working Code

```typescript
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import { mplCore, updateCollectionV1 } from '@metaplex-foundation/mpl-core';
import * as fs from 'fs';

const COLLECTION_ADDRESS = "YOUR_COLLECTION_MINT_ADDRESS_HERE";

async function main() {
    const umi = createUmi('https://api.mainnet-beta.solana.com');
    umi.use(mplCore());

    // Load keypairs
    const currentAuthKeypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync('./current-authority.json', 'utf-8')))
    );
    const newAuthKeypair = umi.eddsa.createKeypairFromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync('./new-authority.json', 'utf-8')))
    );

    const currentAuth = createSignerFromKeypair(umi, currentAuthKeypair);
    const newAuth = createSignerFromKeypair(umi, newAuthKeypair);

    // CRITICAL: Set new wallet as fee payer
    umi.use(signerIdentity(newAuth));

    console.log('Transferring authority...');
    console.log('From:', currentAuth.publicKey.toString());
    console.log('To:', newAuth.publicKey.toString());

    // Transfer authority
    await updateCollectionV1(umi, {
        collection: publicKey(COLLECTION_ADDRESS),
        authority: currentAuth,
        newUpdateAuthority: newAuth.publicKey,
    }).sendAndConfirm(umi);

    console.log('✅ Success!');
}

main().catch(console.error);
```

---

## File Structure

```
your-project/
├── transfer-authority.ts       ← The script above
├── current-authority.json      ← Current collection authority keypair
├── new-authority.json          ← New authority keypair
└── package.json                ← npm dependencies
```

---

## Critical Points to Remember

1. **Use `updateCollectionV1`** not `updateV1`
2. **Set NEW wallet as payer:** `umi.use(signerIdentity(newAuth))`
3. **Explicitly pass authority:** `authority: currentAuth`
4. **New wallet needs SOL** for transaction fees (~0.000005 SOL)

---

## PDA Problem Solution

**Never use your update authority as a PDA!**

```
❌ BAD:  Make authority wallet into PDA
✅ GOOD: Authority = regular wallet, separate PDA for data
```

See `TRAIT_SHOP_ARCHITECTURE.md` for details.

---

## Verify Success

```bash
# Check on Solscan
open https://solscan.io/account/YOUR_COLLECTION_ADDRESS

# Look for "Update Authority" field - should show new address
```

---

## That's It!

Copy this code, change the collection address, run it. Done! 🎉
