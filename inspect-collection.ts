import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, fetchCollectionV1 } from '@metaplex-foundation/mpl-core';
import { publicKey } from '@metaplex-foundation/umi';

async function main() {
    console.log("🔍 Inspecting Collection On-Chain...\n");
    
    const umi = createUmi('https://api.mainnet-beta.solana.com');
    umi.use(mplCore());

    const collectionAddress = publicKey("5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i");
    
    try {
        const collection = await fetchCollectionV1(umi, collectionAddress);
        
        console.log("Collection found!");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Name:", collection.name);
        console.log("URI:", collection.uri);
        console.log("\n📝 Update Authority:");
        console.log("   Address:", collection.updateAuthority.toString());
        
        console.log("\n📦 Collection Stats:");
        console.log("   Number Minted:", collection.numMinted);
        console.log("   Current Size:", collection.currentSize);
        
        console.log("\n✓ Ready to transfer authority!");
        
    } catch (error: any) {
        console.error("❌ Error fetching collection:", error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
    }
}

main();
