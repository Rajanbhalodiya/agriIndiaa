import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);

const transports = [
  new winston.transports.Console({
    format: combine(
      colorize({ all: !isVercel }),
      myFormat
    ),
  })
];

// Only add file logging if NOT running on Vercel (where filesystem is read-only)
if (!isVercel) {
  try {
    transports.push(
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    );
  } catch (err) {
    console.warn('File logging disabled:', err.message);
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat
  ),
  transports,
});

export default logger;
