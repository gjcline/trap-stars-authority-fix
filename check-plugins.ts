import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, fetchCollectionV1 } from '@metaplex-foundation/mpl-core';
import { publicKey } from '@metaplex-foundation/umi';

async function main() {
    const umi = createUmi('https://api.mainnet-beta.solana.com');
    umi.use(mplCore());
    const collection = await fetchCollectionV1(umi, publicKey("5NR4dajELRkLdAPj9ebmW8YrowY61ZX75ugRAvYj7C8i"));
    
    console.log("Collection Details:");
    console.log("- Name:", collection.name);
    console.log("- Update Authority:", collection.updateAuthority.toString());
    console.log("- Num Minted:", collection.numMinted.toString());
    console.log("- Current Size:", collection.currentSize.toString());
    console.log("\nPlugins:");
    if (collection.plugins && collection.plugins.length > 0) {
        collection.plugins.forEach((plugin: any) => {
            console.log("  - Plugin:", plugin);
        });
    } else {
        console.log("  No plugins found");
    }
}

main();
