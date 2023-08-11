"use strict";
require("dotenv").config();
const express = require("express");
const axios = require('axios');

const app = require("./server").expressApp;
const server = require("./server").httServer;
const cors = require("cors");
const bodyParser = require("body-parser");


const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

const moralis = Moralis.start({
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImFlOWNhY2FjLWUzZmYtNDA5Ny04YzRjLTFmMjZjMTMxYTg0OCIsIm9yZ0lkIjoiMzQzOTI2IiwidXNlcklkIjoiMzUzNTU1IiwidHlwZUlkIjoiZjgxYTBhMmQtMDlhMC00ZTg2LWEzNTEtODcyNTg5ZjlmMTVhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE2ODY5ODUxNDMsImV4cCI6NDg0Mjc0NTE0M30.J8_qhSqHy9ptvqnxgKhawQdq6CrEO2NZwgfyUegp0jw",

});



app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




function checkAndFormatURL(url) {
  if (!url || typeof url !== "string") {
    return "";
  }
  if (!url.startsWith("https://")) {
    const ipfsIOURL = "https://ipfs.io/ipfs/";
    const lastSlashIndex = url.lastIndexOf("/");
    const secondLastSlashIndex = url.lastIndexOf("/", lastSlashIndex - 1);
    const data = url.substring(secondLastSlashIndex + 1);
    console.log(secondLastSlashIndex);
    url = ipfsIOURL + data;
  }
  return url;
}

function generateRandomUniqueNumber(maxValue, numberOfDigits) {
  const uniqueNumbers = new Set();
  const maxPossibleValue = Math.pow(10, numberOfDigits);

  if (maxValue >= maxPossibleValue) {
    throw new Error('maxValue should be less than 10^numberOfDigits');
  }

  while (uniqueNumbers.size < maxValue) {
    const randomNumber = Math.floor(Math.random() * maxPossibleValue);
    uniqueNumbers.add(randomNumber);
  }

  const uniqueArray = Array.from(uniqueNumbers);
  const randomIndex = Math.floor(Math.random() * uniqueArray.length);
  return uniqueArray[randomIndex];
}

const maxValue = 100; // Change this to set the maximum value of the random and unique number
const numberOfDigits = 3; // Change this to set the number of digits in the random and unique number

// const randomUniqueNumber = generateRandomUniqueNumber(maxValue, numberOfDigits);


app.use("/testnetWalletNFTs/:address", async (req, res, next) => {
  const address = req.params.address;
  const network = req.query.network
  let allNFTs = [];
  const { description, properties } = req.query
  let chains = []

  let chainsId = [EvmChain.RINKEBY, EvmChain.BSC_TESTNET, EvmChain.MUMBAI, EvmChain.GORIL]
  let name = ["RINKEBY", "BSC", "POLYGON", "GORIL"]
  let chainName = []

  if (network == "RINKEBY") {
    chains.push(EvmChain.RINKEBY),
      chainName.push("RINKEBY")
  }
  else if (network == "BSC") {
    chains.push(EvmChain.BSC_TESTNET),
      chainName.push("BSC")
  }
  else if (network == "POLYGON") {
    chains.push(EvmChain.MUMBAI),
      chainName.push("POLYGON")
  } else if (network == "GORIL") {
    chains.push(EvmChain.GORIL),
      chainName.push("GORIL")
  }
  else {
    chains = chainsId,
      chainName = name
  }


  await Promise.all(chains.map(async (chain, index) => {
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
    });

    if (response.jsonResponse.result.length > 0) {
      const nfts = response.jsonResponse.result.map((nft) => {
        return {
          ...nft,
          network: chainName[index],

        };
      });
      allNFTs.push(nfts);
    }
  }));



  let arr = [];

  if (allNFTs?.length > 0) {
    arr = allNFTs.flatMap((vl) =>
      vl?.map((item) => {
        const metadata = JSON.parse(item.metadata);
        const newItem = {
          token_address: item?.token_address,
          network: item?.network,
          tokenId: item?.token_id,
          token_uri: item?.token_uri,
          name: item?.name || metadata?.name,
          metadata: {
            IPFS: checkAndFormatURL(metadata?.image),
            contractAddress: item?.token_address,
            tokenId: item?.token_id,
          },
          fileUrl: checkAndFormatURL(metadata?.image),
          price: {
            asset: item?.network
          },
          protocol: item?.contract_type,

          creator: {
            avatar: null,
            bio: null,
            chainAddress: null,
            created_at: "2023-06-27T12:58:24.153Z",
            deleted_at: null,
            description: null,
            email: null,
            heroAvatar: null,
            id: generateRandomUniqueNumber(maxValue, numberOfDigits),
            isActive: true,
            isEmailVerified: false,
            isExternalNftSync: false,
            isVerified: false,
            joinedAt: null,
            links: { discord: null, twitter: null, webSite: null, instagram: null },
            nonce: null,
            password: null,
            publicAddress: item?.owner_of,
            slug: null,
            updated_at: null,
            username: item?.owner_of
          },
          isActive: true,
          isBidApproved: false,
          isExternal: false,
          isFixApproved: false,
          isMint: true,
          isSensitive: false,
          isSyncWithBlockChain: false,
          isVerified: false,
          itemOwners: null,
        };
        newItem.description = metadata?.description;
        newItem.properties = metadata?.properties;
        return newItem;
      })
    );

    res.json({ message: 'NFTs list', allNFTs: arr });
  }

  else {
    res.status(400).json({ error: 'Not have any nfts on that wallet' });
  }
});




app.use("/mainnetWalletNFTs/:address", async (req, res, next) => {
  const address = req.params.address;
  const network = req.query.network
  let allNFTs = [];
  const { description, properties } = req.query
  let chains = []
  let chainsId = [EvmChain.ETHEREUM, EvmChain.BSC, EvmChain.POLYGON]

  let name = ["ETH", "BSC", "POLYGON",]
  let chainName = []




  if (network == "ETH") {
    chains.push(EvmChain.ETHEREUM),
      chainName.push("ETH")
  }
  else if (network == "BSC") {
    chains.push(EvmChain.BSC),
      chainName.push("BSC")
  }
  else if (network == "POLYGON") {
    chains.push(EvmChain.POLYGON),
      chainName.push("POLYGON")
  }
  else {
    chains = chainsId,
      chainName = name
  }

  await Promise.all(chains.map(async (chain, index) => {
    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
    });

    console.log("chainName =>", chainName);
    if (response.jsonResponse.result.length > 0) {
      const nfts = response.jsonResponse.result.map((nft) => {
        return {
          ...nft,
          network: chainName[index],
        };
      });
      allNFTs.push(nfts);
    }
  }));




  let arr = [];

  if (allNFTs?.length > 0) {
    arr = allNFTs.flatMap((vl) =>
      vl?.map((item) => {
        const metadata = JSON.parse(item.metadata);
        const newItem = {
          token_address: item?.token_address,
          network: item?.network,
          token_id: item?.token_id,
          token_uri: item?.token_uri,
          name: item?.name || metadata?.name,
          image: checkAndFormatURL(metadata?.image),
        };
        if (description) {
          newItem.description = metadata?.description;
        }
        if (properties) {
          newItem.properties = metadata?.properties;
        }
        return newItem;
      })
    );

    res.json({ message: 'NFTs list', allNFTs: arr });
  }

  else {
    res.status(400).json({ error: 'Not have any nfts on that wallet' });
  }
});


app.use("/", express.static(__dirname + "/public"));


app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,content-type"
  );
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  // Pass to next layer of middleware
  next();
});



// Listening & Initializing
server.listen(process.env.PORT || 3330, async () => {
  console.log(`Running on:`, process.env.PORT || 3330);

});



// 0x7d9Cdb115bb167162989151f670FaA2f9bfc3F6d //polygone testnet
// 0x3b07201606a3A0026F5bC74E5a348f417f17aA00 //eth mainnet
// 0xB05F1928E226CE9E4eE32Db8fcA3A81e39572825  // bsc testnet
// 0xC4eDd2B56480a7A660F85cbDb72b3210daE3ADbF //testnet