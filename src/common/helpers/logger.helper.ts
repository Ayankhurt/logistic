import { Logger } from '@nestjs/common';

export const logger = new Logger('AppLogger');

export const logInfo = (message: string, context?: string) => {
  logger.log(message, context);
};

export const logError = (message: string, trace?: string) => {
  logger.error(message, trace);
};
