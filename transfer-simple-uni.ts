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
        console.log(JSON.stringify(collection.updateAuthority, null, 2));
        
        console.log("\n🔐 Current Authority Type:", collection.updateAuthority.__kind);
        
        if (collection.updateAuthority.__kind === 'Address') {
            console.log("Authority Address:", collection.updateAuthority.fields[0].toString());
        } else if (collection.updateAuthority.__kind === 'Collection') {
            console.log("Authority is a Collection PDA");
        }
        
        console.log("\n📦 Number of Items:", collection.numMinted);
        console.log("Current Length:", collection.currentSize);
        
    } catch (error: any) {
        console.error("❌ Error fetching collection:", error.message);
    }
}

main();


