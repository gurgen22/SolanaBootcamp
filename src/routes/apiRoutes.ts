import express, { Request, Response } from 'express';
import NFTController from '../controllers/NFTController';
const router = express.Router();

const nftController = new NFTController();

router.get("/health", nftController.health)

export default router;