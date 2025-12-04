import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity, publicKey, some } from '@metaplex-foundation/umi';
import { mplCore, updateV1, updateAuthority } from '@metaplex-foundation/mpl-core';
import * as fs from 'fs';

async function main() {
    console.log("🚀 Starting Update Authority Transfer...");
    
    // Initialize Umi
    const umi = createUmi('https://api.mainnet-beta.solana.com');
    umi.use(mplCore());

    // Load wallets
    if (!fs.existsSync('./pda-wallet.json') || !fs.existsSync('./new-wallet.json')) {
        throw new Error("Wallet files not found! Need: pda-wallet.json and new-wallet.json");
    }

    const pdaFile = JSON.parse(fs.readFileSync('./pda-wallet.json', 'utf-8'));
    const newFile = JSON.parse(fs.readFileSync('./new-wallet.json', 'utf-8'));

    const pdaKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(pdaFile));
    const newKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(newFile));

    const pdaSigner = createSignerFromKeypair(umi, pdaKeypair);
    const newSigner = createSignerFromKeypair(umi, newKeypair);

    // Set NEW wallet as payer (this solves the "Transfer: from must not carry data" error)
    umi.use(signerIdentity(newSigner));

    console.log("\n--- Configuration ---");
    console.log("Current Update Authority (PDA):", pdaSigner.publicKey.toString());
    console.log("New Update Authority:", newSigner.publicKey.toString());
    console.log("Payer:", newSigner.publicKey.toString());

    const collectionAddress = publicKey("5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i");
    console.log("Collection Address:", collectionAddress.toString());

    console.log("\n📤 Sending transaction...");
    
    try {
        // Use the updateAuthority helper to wrap the new authority properly
        await updateV1(umi, {
            asset: collectionAddress,
            authority: pdaSigner,  // Current authority signs
            newUpdateAuthority: some(updateAuthority('Address', [newSigner.publicKey])),
        }).sendAndConfirm(umi);

        console.log("\n✅ SUCCESS! Update Authority transferred!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("New Update Authority:", newSigner.publicKey.toString());
        
    } catch (error: any) {
        console.error("\n❌ Transaction failed!");
        console.error("Error:", error.message);
        if (error.logs) {
            console.error("\nProgram Logs:");
            error.logs.forEach((log: string) => console.error("  ", log));
        }
        throw error;
    }
}

main().catch(err => {
    console.error("\n❌ Fatal Error:", err);
    process.exit(1);
});
