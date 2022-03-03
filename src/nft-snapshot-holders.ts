import {
  PublicKey,
  Connection,
  ParsedAccountData,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import fs from "fs";
import async from "async";
import hashlist01 from "./hashlist/hashlist_01.json";
import hashlist1Sol from "./hashlist/hashlist_1Sol.json";
import hashlistAncient8 from "./hashlist/hashlist_Ancient8.json";
import hashlistApricot from "./hashlist/hashlist_Apricot.json";
import hashlistBonfida from "./hashlist/hashlist_Bonfida.json";
import hashlistClover from "./hashlist/hashlist_Clover.json";
import hashlistCyberConnect from "./hashlist/hashlist_CyberConnect.json";
import hashlistDappio from "./hashlist/hashlist_Dappio.json";
import hashlistDrift from "./hashlist/hashlist_Drift.json";
import hashlistFrancium from "./hashlist/hashlist_Francium.json";
import hashlistGenopets from "./hashlist/hashlist_Genopets.json";
import hashlistJupiter from "./hashlist/hashlist_Jupiter.json";
import hashlistMango from "./hashlist/hashlist_Mango.json";
import hashlistMarinade from "./hashlist/hashlist_Marinade.json";
import hashlistOrca from "./hashlist/hashlist_Orca.json";
import hashlistPort from "./hashlist/hashlist_Port.json";
import hashlistRaydium from "./hashlist/hashlist_Raydium.json";
import hashlistRealy from "./hashlist/hashlist_Realy.json";
import hashlistScareCity from "./hashlist/hashlist_ScareCity.json";
import hashlistSerum from "./hashlist/hashlist_Serum.json";
import hashlistSlope from "./hashlist/hashlist_Slope.json";
import hashlistSolend from "./hashlist/hashlist_Solend.json";
import hashlistSpaceRunners from "./hashlist/hashlist_SpaceRunners.json";
import hashlistStepN from "./hashlist/hashlist_StepN.json";
import hashlistSypool from "./hashlist/hashlist_Sypool.json";
import hashlistWormhole from "./hashlist/hashlist_Wormhole.json";
import hashlistZebec from "./hashlist/hashlist_Zebec.json";
import { isTooManyTries, retry } from "ts-retry";

// https://explorer.solana.com/block/122948286
const SNAPSHOT_SLOT = 122948286;

const rpc = new Connection("https://rpc.ankr.com/solana");

// Queue to process each NFT with concurrency 100.
const q = async.queue(processNFT, 100);
q.error(function (err, task) {
  console.error(`NFT queue task experienced an error ${err}`);
});

type NFT = {
  token: string;
  campaign: string;
};

async function processNFT(nft: NFT) {
  const filename = `snapshot_${nft.campaign}.txt`;
  try {
    await retry(
      async () => {
        // In metaplex, since every NFT is its own "token" with supply = 1, the only
        // way to get NFT owner is through getTokenLargestAccounts
        const largestAccounts = await rpc.getTokenLargestAccounts(
          new PublicKey(nft.token)
        );
        const largestAccountInfo = await rpc.getParsedAccountInfo(
          largestAccounts.value[0].address
        );

        // Get current owner
        let owner = (largestAccountInfo?.value?.data as ParsedAccountData)
          .parsed.info.owner;

        // Check all related transactions to find owner at the time of the snapshot
        const confirmedSignatures = await rpc.getSignaturesForAddress(
          new PublicKey(nft.token)
        );

        var handled = false;
        for (const sig of confirmedSignatures) {
          if (sig.slot > SNAPSHOT_SLOT) {
            // Need to find the last tx right before snapshot time
            continue;
          } else {
            const tx = await rpc.getParsedTransaction(sig.signature);
            if (tx?.transaction.message.instructions) {
              // First check instructions to find whether it's being used by
              // some special programs such as marketplace custodial wallet
              for (const instRaw of tx?.transaction.message.instructions) {
                // Instruction is of type "PartiallyDecodedInstruction"
                const inst = instRaw as PartiallyDecodedInstruction;

                // Interaction with Magic eden program that handles escrow/listing/cancel/executesale
                if (
                  inst.programId.toBase58() ==
                  "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K"
                ) {
                  owner = inst.accounts[0].toBase58();
                  console.log(
                    `${nft.token}: Found magic eden escrow/listing/cancel/executesale tx. Owner: ${owner}`
                  );
                  handled = true;
                }

                // Interaction with solsea that handles escrow/listing/cancel/executesale
                // Since solsea program's input is very tricky to decipher, we will take the
                // payer account instead, as either the buyer or the seller has to initiate
                // the transaction
                if (
                  inst.programId.toBase58() ==
                  "617jbWo616ggkDxvW1Le8pV38XLbVSyWY8ae6QUmGBAU"
                ) {
                  owner =
                    tx.transaction.message.accountKeys[0].pubkey.toBase58();
                  console.log(
                    `${nft.token}: Found solsea escrow/listing/cancel/executesale tx. Owner: ${owner}`
                  );
                  handled = true;
                }

                // Interaction with slope that handles escrow/listing/cancel/executesale
                if (
                  inst.programId.toBase58() ==
                  "cCSrAM5p4R3tzUnja7hHCMTzdWgvwKhdKwe3cchRVLz"
                ) {
                  owner = inst.accounts[0].toBase58();
                  console.log(
                    `${nft.token}: Found slope escrow/listing/cancel/executesale tx. Owner: ${owner}`
                  );
                  handled = true;
                }

                if (handled) {
                  fs.appendFileSync(
                    filename,
                    `Owner:${owner},NFT:${nft.token},Campaign:${nft.campaign}\n`
                  );
                  return;
                }
              }
            }

            // If the token didn't interact with special programs, then this is
            // likely a transfer event or mint
            if (tx?.meta?.postTokenBalances) {
              for (const bal of tx?.meta?.postTokenBalances) {
                if (bal.uiTokenAmount.uiAmount === 1.0) {
                  owner = bal.owner!;
                  console.log(
                    `${nft.token}: Found token mint/transfer tx. Owner: ${owner}`
                  );
                  fs.appendFileSync(
                    filename,
                    `Owner:${owner},NFT:${nft.token},Campaign:${nft.campaign}\n`
                  );
                  handled = true;
                  return;
                }
              }
            }
          }
        }

        // This will trigger retries.
        throw `TX maybe not properly handled. Owner: ${owner}`;
      },
      { delay: 1000, maxTry: 10 }
    );
  } catch (err) {
    if (isTooManyTries(err)) {
      console.error(`${nft.token}: too many retries getting sig.`);
    } else {
      console.error(`${nft.token}: ${err}`);
    }
    return;
  }
}

for (const token of hashlist01) {
  q.push({ campaign: "01", token: token });
}
for (const token of hashlist1Sol) {
  q.push({ campaign: "1Sol", token: token });
}
for (const token of hashlistAncient8) {
  q.push({ campaign: "Ancient8", token: token });
}
for (const token of hashlistApricot) {
  q.push({ campaign: "Apricot", token: token });
}
for (const token of hashlistBonfida) {
  q.push({ campaign: "Bonfida", token: token });
}
for (const token of hashlistClover) {
  q.push({ campaign: "Clover", token: token });
}
for (const token of hashlistCyberConnect) {
  q.push({ campaign: "CyberConnect", token: token });
}
for (const token of hashlistDappio) {
  q.push({ campaign: "Dappio", token: token });
}
for (const token of hashlistDrift) {
  q.push({ campaign: "Drift", token: token });
}
for (const token of hashlistFrancium) {
  q.push({ campaign: "Francium", token: token });
}
for (const token of hashlistGenopets) {
  q.push({ campaign: "Genopets", token: token });
}
for (const token of hashlistJupiter) {
  q.push({ campaign: "Jupiter", token: token });
}
for (const token of hashlistMango) {
  q.push({ campaign: "Mango", token: token });
}
for (const token of hashlistMarinade) {
  q.push({ campaign: "Marinade", token: token });
}
for (const token of hashlistOrca) {
  q.push({ campaign: "Orca", token: token });
}
for (const token of hashlistPort) {
  q.push({ campaign: "Port", token: token });
}
for (const token of hashlistRaydium) {
  q.push({ campaign: "Raydium", token: token });
}
for (const token of hashlistRealy) {
  q.push({ campaign: "Realy", token: token });
}
for (const token of hashlistScareCity) {
  q.push({ campaign: "ScareCity", token: token });
}
for (const token of hashlistSerum) {
  q.push({ campaign: "Serum", token: token });
}
for (const token of hashlistSlope) {
  q.push({ campaign: "Slope", token: token });
}
for (const token of hashlistSolend) {
  q.push({ campaign: "Solend", token: token });
}
for (const token of hashlistSpaceRunners) {
  q.push({ campaign: "SpaceRunners", token: token });
}
for (const token of hashlistStepN) {
  q.push({ campaign: "StepN", token: token });
}
for (const token of hashlistSypool) {
  q.push({ campaign: "Sypool", token: token });
}
for (const token of hashlistWormhole) {
  q.push({ campaign: "Wormhole", token: token });
}
for (const token of hashlistZebec) {
  q.push({ campaign: "Zebec", token: token });
}
