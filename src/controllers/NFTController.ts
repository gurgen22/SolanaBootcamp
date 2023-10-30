import { Request, Response, NextFunction } from "express";
import logger from "../utils/winstonLogger";
import { Connection, clusterApiUrl, PublicKey, Signer } from "@solana/web3.js"
import * as web3 from "@solana/web3.js"
import dotenv from "dotenv"
dotenv.config()
import {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
    toMetaplexFile,
    NftWithToken,
} from "@metaplex-foundation/js"
import * as fs from "fs"



class NFTController {

    constructor() {
    }

    public connection = async () => {
        const connection = new Connection(clusterApiUrl("devnet"));

        // initialize a keypair for the user
        const user = await this.initializeKeypair(connection);
        if (user) {
            logger.warn("PublicKey:" + user.publicKey.toBase58());
        } else {
            console.error("User is null. Handle the error or issue accordingly.");
        }

        const metaplex = Metaplex.make(connection)
            .use(keypairIdentity(user))
            .use(
                bundlrStorage({
                    address: "https://devnet.bundlr.network",
                    providerUrl: "https://api.devnet.solana.com",
                    timeout: 60000,
                }),
            );

    }

    public health = async (req: Request, res: Response, next: NextFunction) => {
        return res.status(200).json({ message: "Successfully" })
    }

    public initializeKeypair = async (
        connection: web3.Connection
    ): Promise<web3.Keypair> => {
        if (!process.env.PRIVATE_KEY) {
            console.log("Creating .env file")
            const signer = web3.Keypair.generate()
            fs.writeFileSync(".env", `PRIVATE_KEY=[${signer.secretKey.toString()}]`)
            await this.airdropSolIfNeeded(signer, connection)

            return signer
        }

        const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[]
        const secretKey = Uint8Array.from(secret)
        const keypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey)
        await this.airdropSolIfNeeded(keypairFromSecretKey, connection)
        return keypairFromSecretKey
    }

    public airdropSolIfNeeded = async (
        signer: web3.Keypair,
        connection: web3.Connection
    ) => {
        const balance = await connection.getBalance(signer.publicKey)
        console.log("Current balance is", balance / web3.LAMPORTS_PER_SOL)

        if (balance < web3.LAMPORTS_PER_SOL) {
            console.log("Airdropping 1 SOL...")
            const airdropSignature = await connection.requestAirdrop(
                signer.publicKey,
                web3.LAMPORTS_PER_SOL
            )

            const latestBlockHash = await connection.getLatestBlockhash()

            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: airdropSignature,
            })

            const newBalance = await connection.getBalance(signer.publicKey)
            console.log("New balance is", newBalance / web3.LAMPORTS_PER_SOL)
        }
    }

}
export default NFTController;

