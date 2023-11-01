import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv"
dotenv.config()
import NFTService from "../service/NFTService";

class NFTController {
    private nftService;

    constructor() {

        this.nftService = new NFTService();
    }

    public health = async (req: Request, res: Response, next: NextFunction) => {

        return res.status(200).json({ message: "Successfully" })
    }

    public addNFT = async (req: Request, res: Response, next: NextFunction) => {

        try {
            const nft = await this.nftService.addNFT(req.body, req.headers);

            res.status(201).json({ message: "NFT added successfully", data: nft })

        } catch (err: any) {
            next(err);
        }
    }
}

export default NFTController;

