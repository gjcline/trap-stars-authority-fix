import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// --- FIX: Change import from TransactionBuilder class to transactionBuilder function ---
import { createSignerFromKeypair, signerIdentity, publicKey, transactionBuilder } from '@metaplex-foundation/umi';
import { mplCore, updateV1 } from '@metaplex-foundation/mpl-core'; 
import * as fs from 'fs';

async function main() {
    console.log("🚀 SCRIPT STARTED: Initializing Umi...");
    const umi = createUmi('https://api.mainnet-beta.solana.com');
    umi.use(mplCore());

    // 2. Load Wallets
    if (!fs.existsSync('./pda-wallet.json') || !fs.existsSync('./new-wallet.json') || !fs.existsSync('./mint-auth-wallet.json')) {
        throw new Error("Wallet files not found! Ensure pda-wallet.json, new-wallet.json, AND mint-auth-wallet.json are in this folder.");
    }

    const pdaFile = JSON.parse(fs.readFileSync('./pda-wallet.json', 'utf-8'));
    const newFile = JSON.parse(fs.readFileSync('./new-wallet.json', 'utf-8'));
    const mintAuthFile = JSON.parse(fs.readFileSync('./mint-auth-wallet.json', 'utf-8')); 

    const pdaKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(pdaFile));
    const newKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(newFile));
    const mintAuthKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(mintAuthFile));

    const pdaSigner = createSignerFromKeypair(umi, pdaKeypair);
    const newSigner = createSignerFromKeypair(umi, newKeypair);
    const mintAuthSigner = createSignerFromKeypair(umi, mintAuthKeypair);

    // 3. Set Clean Wallet as Payer (Bypasses the "Transfer: from" error)
    // The newSigner is the wallet paying the fees.
    umi.use(signerIdentity(newSigner));

    console.log("--- Configuration ---");
    console.log("Payer (Clean Wallet):", newSigner.publicKey.toString());
    console.log("Update Authority (PDA):", pdaSigner.publicKey.toString());
    console.log("Mint Authority Signer:", mintAuthSigner.publicKey.toString());

    // REPLACE THIS WITH YOUR COLLECTION MINT ADDRESS
    const collectionAddress = publicKey("5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i");
    
    console.log("Updating Collection:", collectionAddress.toString());

    // 4. Send Transaction
    const instruction = updateV1(umi, {
        asset: collectionAddress,
        authority: pdaSigner,     
        newUpdateAuthority: { 
            __kind: 'Address',
            fields: [newSigner.publicKey]
        }
    });

    // --- FIX: Instantiate using the functional export 'transactionBuilder()' ---
    const transaction = transactionBuilder().add({ instruction });
    
    // This structure worked in earlier attempts before we introduced the Mint Authority.
    await transaction.sendAndConfirm(umi, { 
        signers: [pdaSigner, mintAuthSigner] // Pass signers directly to the options object
    });

    console.log("✅ Success! Update Authority transferred.");
    console.log("New Authority Address:", newSigner.publicKey.toString());
}

main().catch(err => {
    console.error("❌ Error:", err);
});


