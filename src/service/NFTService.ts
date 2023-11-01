import { Metaplex, NftWithToken, toMetaplexFile } from "@metaplex-foundation/js";

import * as fs from 'fs';
import { Request, Response, NextFunction } from "express";
import logger from "../utils/winstonLogger";
import { Connection, clusterApiUrl, PublicKey, Signer } from "@solana/web3.js"
import * as web3 from "@solana/web3.js"
import dotenv from "dotenv"
dotenv.config()
import {

    keypairIdentity,
    bundlrStorage,

} from "@metaplex-foundation/js"
import { log } from "console";

class NFTService {
    private metaplex: any;
    private user: any;
    constructor() {
        this.metaplex = null; 
        this.user = null; 
        this.initialize();
    }

    async initialize() {
        const connection = new Connection(clusterApiUrl("devnet"));

        // initialize a keypair for the user
        this.user = await this.initializeKeypair(connection);
        if (this.user) {
            console.log("PublicKey: " + this.user.publicKey.toBase58());
        } else {
            console.error("User is null. Handle the error or issue accordingly.");
        }

        this.metaplex = Metaplex.make(connection)
            .use(keypairIdentity(this.user))
            .use(
                bundlrStorage({
                    address: "https://devnet.bundlr.network",
                    providerUrl: "https://api.devnet.solana.com",
                    timeout: 60000,
                })
            );
    }

    async initializeKeypair(connection) {
        if (!process.env.PRIVATE_KEY) {
            console.log("Creating .env file");
            const signer = web3.Keypair.generate();
            fs.writeFileSync(".env", `PRIVATE_KEY=[${signer.secretKey.toString()}]`);
            await this.airdropSolIfNeeded(signer, connection);

            return signer;
        }

        const secret = JSON.parse(process.env.PRIVATE_KEY || "[]") as number[];
        const secretKey = Uint8Array.from(secret);
        const keypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey);
        await this.airdropSolIfNeeded(keypairFromSecretKey, connection);
        return keypairFromSecretKey;
    }

    async airdropSolIfNeeded(signer, connection) {
        try {
            const balance = await connection.getBalance(signer.publicKey);
            console.log("Current balance is", balance / web3.LAMPORTS_PER_SOL);

            if (balance < web3.LAMPORTS_PER_SOL) {
                console.log("Airdropping 1 SOL...");
                const airdropSignature = await connection.requestAirdrop(
                    signer.publicKey,
                    web3.LAMPORTS_PER_SOL
                );

                const latestBlockHash = await connection.getLatestBlockhash();

                await connection.confirmTransaction({
                    blockhash: latestBlockHash.blockhash,
                    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                    signature: airdropSignature,
                });

                const newBalance = await connection.getBalance(signer.publicKey);
                console.log("New balance is", newBalance / web3.LAMPORTS_PER_SOL);
            }
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    async addNFT(body, headers) {
        logger.info("burda :" + JSON.stringify(body))
        const uri = await this.uploadMetadata(this.metaplex, body);
        logger.info("uploadMetadata çalıştı")
        // create an NFT using the helper function and the URI from the metadata
        const nft = await this.createNft(this.metaplex, uri, body);
        logger.info("createNft çalıştı")

        return nft;
    }

    async uploadMetadata(metaplex, nftData) {
        // file to buffer

        const buffer = fs.readFileSync("src/assets/avatar1.png");

        // buffer to metaplex file
        const file = toMetaplexFile(buffer, "avatar1");

        // upload image and get image uri
        const imageUri = await metaplex.storage().upload(file);
        console.log("image uri:", imageUri);

        // upload metadata and get metadata uri (off chain metadata)
        const { uri } = await metaplex.nfts().uploadMetadata({
            name: nftData.name,
            symbol: nftData.symbol,
            description: nftData.description,
            image: imageUri,
        });

        console.log("metadata uri:", uri);
        return uri;
    }

    async createNft(metaplex, uri, nftData) {
        const { nft } = await metaplex.nfts().create(
            {
                uri: uri, // metadata URI
                name: nftData.name,
                sellerFeeBasisPoints: nftData.sellerFeeBasisPoints,
                symbol: nftData.symbol,
            },
            { commitment: "finalized" }
        );

        console.log(
            `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
        );

        return nft;
    }
}

export default NFTService;