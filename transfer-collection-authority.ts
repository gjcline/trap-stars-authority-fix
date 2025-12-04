#!/usr/bin/env npx ts-node
/**
 * Metaplex Core Collection - Update Authority Transfer Tool
 * 
 * This script transfers the update authority of a Metaplex Core collection
 * from one wallet to another. 
 * 
 * USAGE:
 *   1. Place this script in a directory with two keypair files:
 *      - current-authority.json (the wallet that currently controls the collection)
 *      - new-authority.json (the wallet that will take over control)
 * 
 *   2. Update the COLLECTION_ADDRESS constant below
 * 
 *   3. Run: npx ts-node transfer-collection-authority.ts
 * 
 * REQUIREMENTS:
 *   npm install @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/umi @metaplex-foundation/mpl-core
 * 
 * IMPORTANT NOTES:
 *   - The NEW authority wallet pays transaction fees (0.000005 SOL)
 *   - The CURRENT authority wallet must sign to authorize the transfer
 *   - This works for Metaplex Core collections only (not Token Metadata standard)
 *   - Make backups of your keypair files before running!
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createSignerFromKeypair, signerIdentity, publicKey } from '@metaplex-foundation/umi';
import { mplCore, updateCollectionV1 } from '@metaplex-foundation/mpl-core';
import * as fs from 'fs';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

const COLLECTION_ADDRESS = "5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i"; // <-- CHANGE THIS
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"; // or use your own RPC
const CURRENT_AUTHORITY_FILE = "./current-authority.json";
const NEW_AUTHORITY_FILE = "./new-authority.json";

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
    console.log("🔐 Metaplex Core Collection Authority Transfer");
    console.log("================================================\n");

    // Initialize Umi
    const umi = createUmi(RPC_ENDPOINT);
    umi.use(mplCore());

    // Validate files exist
    if (!fs.existsSync(CURRENT_AUTHORITY_FILE)) {
        throw new Error(`❌ File not found: ${CURRENT_AUTHORITY_FILE}`);
    }
    if (!fs.existsSync(NEW_AUTHORITY_FILE)) {
        throw new Error(`❌ File not found: ${NEW_AUTHORITY_FILE}`);
    }

    // Load keypairs
    console.log("📂 Loading keypairs...");
    const currentAuthFile = JSON.parse(fs.readFileSync(CURRENT_AUTHORITY_FILE, 'utf-8'));
    const newAuthFile = JSON.parse(fs.readFileSync(NEW_AUTHORITY_FILE, 'utf-8'));

    const currentAuthKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(currentAuthFile));
    const newAuthKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(newAuthFile));

    const currentAuthSigner = createSignerFromKeypair(umi, currentAuthKeypair);
    const newAuthSigner = createSignerFromKeypair(umi, newAuthKeypair);

    // Set NEW authority as fee payer
    // This is critical for PDAs that can't pay fees themselves
    umi.use(signerIdentity(newAuthSigner));

    console.log("\n📋 Transfer Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Collection:         ${COLLECTION_ADDRESS}`);
    console.log(`Current Authority:  ${currentAuthSigner.publicKey.toString()}`);
    console.log(`New Authority:      ${newAuthSigner.publicKey.toString()}`);
    console.log(`Fee Payer:          ${newAuthSigner.publicKey.toString()}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const collectionAddress = publicKey(COLLECTION_ADDRESS);

    // Confirm before proceeding
    console.log("⚠️  This action will transfer ownership of the collection.");
    console.log("   The current authority will no longer be able to manage it.\n");
    
    // In a real interactive script, you'd add:
    // const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    // const answer = await new Promise(resolve => readline.question('Continue? (yes/no): ', resolve));
    // if (answer !== 'yes') { console.log('Cancelled.'); process.exit(0); }

    console.log("📤 Sending transaction...\n");

    try {
        // THE CRITICAL CALL: updateCollectionV1 with explicit authority
        await updateCollectionV1(umi, {
            collection: collectionAddress,
            authority: currentAuthSigner,  // Current authority must sign
            newUpdateAuthority: newAuthSigner.publicKey,  // New authority address
        }).sendAndConfirm(umi);

        console.log("✅ SUCCESS! Update Authority Transferred!\n");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`New Authority: ${newAuthSigner.publicKey.toString()}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        console.log(`✓ Verify on Solscan: https://solscan.io/account/${COLLECTION_ADDRESS}`);
        console.log(`✓ Verify on Explorer: https://explorer.solana.com/address/${COLLECTION_ADDRESS}\n`);

    } catch (error: any) {
        console.error("\n❌ Transaction Failed!");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("Error:", error.message);
        
        if (error.logs) {
            console.error("\n📋 Program Logs:");
            error.logs.forEach((log: string) => console.error("   ", log));
        }
        
        console.error("\n💡 Common Issues:");
        console.error("   - Wrong collection address");
        console.error("   - Current authority keypair doesn't match on-chain authority");
        console.error("   - Insufficient SOL in new authority wallet for fees");
        console.error("   - Collection has plugins that require additional accounts\n");
        
        throw error;
    }
}

// Run the script
main().catch(err => {
    console.error("\n❌ Fatal Error:", err);
    process.exit(1);
});
