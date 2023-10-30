import morgan from 'morgan';
import logger from '../utils/winstonLogger';
const stream = {
  write: (message: string) => {
    // Use the winston logger to log the message
    logger.http(message.trim());
  },
};

export const morganLogger = morgan('combined', { stream });
