import { 
    Connection, 
    Keypair, 
    Transaction, 
    TransactionInstruction,
    PublicKey,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import * as fs from 'fs';

// Metaplex Core Program ID
const MPL_CORE_PROGRAM_ID = new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d');

// UpdateV1 instruction discriminator for Metaplex Core
const UPDATE_V1_DISCRIMINATOR = Buffer.from([0x32, 0xc2, 0x9a, 0x1e, 0x7b, 0x4f, 0x1e, 0x3a]);

async function main() {
    console.log("🚀 Starting Update Authority Transfer (Web3.js approach)...");
    
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    // Load wallets - ONLY NEED TWO FILES
    if (!fs.existsSync('./pda-wallet.json') || !fs.existsSync('./new-wallet.json')) {
        throw new Error("Wallet files not found! Need: pda-wallet.json and new-wallet.json");
    }

    const pdaKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync('./pda-wallet.json', 'utf-8')))
    );
    const newKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync('./new-wallet.json', 'utf-8')))
    );

    console.log("\n--- Configuration ---");
    console.log("Current Update Authority (PDA):", pdaKeypair.publicKey.toString());
    console.log("New Update Authority:", newKeypair.publicKey.toString());
    console.log("Payer (fee payer):", newKeypair.publicKey.toString());

    const collectionAddress = new PublicKey("5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i");
    console.log("Collection Address:", collectionAddress.toString());

    // Build the UpdateV1 instruction data
    // Format: discriminator(8) + new_name(Option) + new_uri(Option) + new_update_authority(Option)
    // We only want to update authority, so: discriminator + [0,0,1] + [0] + pubkey
    const instructionData = Buffer.concat([
        UPDATE_V1_DISCRIMINATOR,  // 8 bytes
        Buffer.from([0]),         // new_name: None
        Buffer.from([0]),         // new_uri: None  
        Buffer.from([1]),         // new_update_authority: Some
        Buffer.from([0]),         // Address variant (not Collection)
        newKeypair.publicKey.toBuffer() // 32 bytes - the new authority pubkey
    ]);

    const updateInstruction = new TransactionInstruction({
        programId: MPL_CORE_PROGRAM_ID,
        keys: [
            { pubkey: collectionAddress, isSigner: false, isWritable: true },
            { pubkey: pdaKeypair.publicKey, isSigner: true, isWritable: false }, // current authority must sign
            { pubkey: newKeypair.publicKey, isSigner: true, isWritable: true }, // payer
        ],
        data: instructionData
    });

    // Create transaction
    const transaction = new Transaction();
    transaction.add(updateInstruction);
    transaction.feePayer = newKeypair.publicKey;
    
    console.log("\n📡 Getting recent blockhash...");
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;

    console.log("📤 Sending transaction...");
    console.log("   Signers: PDA wallet + New wallet");
    
    try {
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [newKeypair, pdaKeypair], // NEW wallet signs as payer, PDA wallet signs as authority
            {
                skipPreflight: false,
                commitment: 'confirmed',
                maxRetries: 3
            }
        );

        console.log("\n✅ SUCCESS! Update Authority transferred!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Transaction Signature:", signature);
        console.log("View on Solscan:", `https://solscan.io/tx/${signature}`);
        console.log("View on SolanaFM:", `https://solana.fm/tx/${signature}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("New Update Authority:", newKeypair.publicKey.toString());
        
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



