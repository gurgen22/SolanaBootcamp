process.env['NODE_CONFIG_DIR'] = __dirname + '/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import 'reflect-metadata'
import { morganLogger } from './middleware/morganLogger'
import logger from './utils/winstonLogger';
import apiRoutes from './routes/apiRoutes';
import dotenv from "dotenv"
dotenv.config()

const app = express();

// Enable CORS and security-related headers
app.use(cors());
app.use(helmet());

// Parse JSON and URL-encoded request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Apply middleware
//http actions logger
app.use(morganLogger);
// app.use(authMiddleware);

// Apply routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.message);
    res.status(500).json({ message: err.message });
});

let counter=0;

const port : number = 3010;
app.listen(port, () => {
    logger.warn(`Server is starting on port ${port}`);
});

export { app };
