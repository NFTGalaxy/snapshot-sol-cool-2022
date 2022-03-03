import { PublicKey, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import async from "async";
import path from "path";

const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const MAX_CREATOR_LIMIT = 5;
const MAX_DATA_SIZE =
  4 +
  MAX_NAME_LENGTH +
  4 +
  MAX_SYMBOL_LENGTH +
  4 +
  MAX_URI_LENGTH +
  2 +
  1 +
  4 +
  MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;
const MAX_METADATA_LEN = 1 + 32 + 32 + MAX_DATA_SIZE + 1 + 1 + 9 + 172;

const conn = new Connection("https://ssc-dao.genesysgo.net/");

const TOKEN_METADATA_PROGRAM = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

type Campaign = {
  campaignName: string;
  creatorAddress: string;
};

var allTokens: string[] = [];

const campaigns: Campaign[] = [
  {
    campaignName: "Serum",
    creatorAddress: "FELHk34cHSAAZaK82W9nACc7z2faYurWB24xC5aMT7CL",
  },
  {
    campaignName: "Raydium",
    creatorAddress: "HBd1GQKQCMdDwLiHpuouM4fmqyR1onPa3Km4t9Qttw5x",
  },
  {
    campaignName: "Wormhole",
    creatorAddress: "DGsNktadFuCyNXTSHYbtSyetAp3XjCKh55TzEdFUvc3p",
  },
  {
    campaignName: "Apricot",
    creatorAddress: "YBHY7BF2qLRPHABKa78SMkUKJ6UfFU92mvsFvm4T3Kr",
  },
  {
    campaignName: "Orca",
    creatorAddress: "HLP3NBBLUAoiDMM7A6YQjJzsZq5QfL2pbVndYBP9eChs",
  },
  {
    campaignName: "Slope",
    creatorAddress: "CWa5AW7Rjy6LJmBHgfWciiTvrVpL5rGMeZZAMJEAk9sW",
  },
  {
    campaignName: "Bonfida",
    creatorAddress: "75qihQ3K2Wdhga4Lf2oGH4dCkYiXKQ7B3XEPzHBVJcoA",
  },
  {
    campaignName: "Port",
    creatorAddress: "7iaVeUa44wns7aVsRe9e1EuNqWQroQBckba2MyrcXHVX",
  },
  {
    campaignName: "Drift",
    creatorAddress: "3iTvptxjbPbZQKYd5RxEpNJ199VDuasuVgsgm9gZaeTC",
  },
  {
    campaignName: "Ancient8",
    creatorAddress: "3Xq92W2EgtuYjkpWVAWqdrSNtUxmKE8zUWMu1KC2ZTXc",
  },
  {
    campaignName: "StepN",
    creatorAddress: "7vD8wC5WpS614DF97abv9TUa9Nzc4N9UbbMELgEG5scs",
  },
  {
    campaignName: "Genopets",
    creatorAddress: "3MQsaPWo7u8Q7MmGkGs6s3KpgHTtsM5qGGGV8xr3LtQF",
  },
  {
    campaignName: "Sypool",
    creatorAddress: "EHECjwQMEjSLZrCjZuwsF3mMNQdzw4nQoys3yFVW7kkk",
  },
  {
    campaignName: "Mango",
    creatorAddress: "6pxPRDvZMu3MXmzysG1VgWLBQUxx9w4wAuoheBgtrJLF",
  },
  {
    campaignName: "CyberConnect",
    creatorAddress: "D6hfhoA56PyAtTpWUeLDnKnjVEACzFuCm5S6rEnxbjv1",
  },
  {
    campaignName: "01",
    creatorAddress: "HQuiU4oXf7hqeWxL6oHtrW1RHyro9rDWsk4FMHQenSeU",
  },
  {
    campaignName: "Zebec",
    creatorAddress: "5Wh83uHhTDsYtDfGcue6bJWh2ggn9u2ZbP7eUieibPUx",
  },
  {
    campaignName: "Francium",
    creatorAddress: "F7UUvM84ted2mavGfNXwkXHcp52Ri2QYouxJ3gDF3JUM",
  },
  {
    campaignName: "ScareCity",
    creatorAddress: "GcnJFmJBmjS7T2aiSKsiyCBc5sXpMysfdgivUfsMuE52",
  },
  {
    campaignName: "1Sol",
    creatorAddress: "A1xcTLQQ1ttg7R89Qsu4yW9mzvZVAmyhDukwtZysENiV",
  },
  {
    campaignName: "Realy",
    creatorAddress: "C9Z2iw3qdhVCAursVaWSuk6KseS2vxxRYADhoaQc6JEV",
  },
  {
    campaignName: "Solend",
    creatorAddress: "DAg58QWjp9NfoVM69556uk9YUYAK7y9K93i4MxhxkSNP",
  },
  {
    campaignName: "Dappio",
    creatorAddress: "KEGN2n7uS2fAj35q24rhVsshTJ91ByfNC3S883PKcRF",
  },
  {
    campaignName: "Jupiter",
    creatorAddress: "G9nLMtKF3wELCXuzCQW8A23dZCbMgViaTo3m2aTC2xxA",
  },
  {
    campaignName: "Marinade",
    creatorAddress: "72m5Gykp2GLbDA3fQb2mkE1qucM3uyFVgj7rJLGLBbDd",
  },
  {
    campaignName: "Clover",
    creatorAddress: "HeumunqL1qZfSXxm6q6VaAkDNoUcGxouU4V48pW1SEos",
  },
  {
    campaignName: "SpaceRunners",
    creatorAddress: "4Tx7Tczk7wzU6U9ymBU2jJWXXUNat5rgFVcLA1rakjbp",
  },
];

type NFT = {
  token: string;
  campaignName: string;
};

const campaignQueue = async.queue(loadCampaign, 30);

async function loadCampaign(campaign: Campaign) {
  console.log(
    `${campaign.campaignName}: Listing NFTs under creator/updateAuthority address: ${campaign.creatorAddress}`
  );

  const nfts: string[] = [];

  // List all NFTs associated with the campaign-specific updateAuthority
  const metadataAccounts = await conn.getProgramAccounts(
    TOKEN_METADATA_PROGRAM,
    {
      dataSlice: { offset: 33, length: 32 },
      filters: [
        { dataSize: MAX_METADATA_LEN },
        {
          memcmp: {
            offset: 1, // updateAuthority offset
            bytes: campaign.creatorAddress,
          },
        },
      ],
    }
  );

  metadataAccounts.map((metadataAccountInfo, idx) => {
    // Calculate NFT address
    const nft: NFT = {
      token: bs58.encode(metadataAccountInfo.account.data),
      campaignName: campaign.campaignName,
    };
    nfts.push(nft.token);
    allTokens.push(nft.token);
  });

  fs.writeFileSync(
    path.join(process.cwd(), `hashlist_${campaign.campaignName}.json`),
    JSON.stringify(nfts)
  );

  console.log(`${campaign.campaignName}: Got ${metadataAccounts.length} NFTs`);
}

campaignQueue.error(function (err, task) {
  console.error(`Campaign queue task experienced an error ${err}`);
});

campaigns.forEach(function (campaign, index) {
  setTimeout(function () {
    campaignQueue.push(campaign);
  }, index * 3000); // With 3s sleep to bring less immediate load to RPC
});
campaignQueue.drain(() => {
  console.log(`Finished loading all campaigns`);

  fs.writeFileSync(
    path.join(process.cwd(), `hashlist.json`),
    JSON.stringify(allTokens)
  );
});
