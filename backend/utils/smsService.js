import logger from './logger.js';

export const sendSMS = async (options) => {
  try {
    // Integration point for Twilio or MSG91
    // Example:
    // await twilioClient.messages.create({
    //   body: options.message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: options.phone
    // });
    
    console.log(`📱 SMS sent to ${options.phone}: ${options.message}`);
    logger.info(`MOCK SMS Sent to ${options.phone}: ${options.message}`);
  } catch (error) {
    logger.error('Error sending SMS', error);
  }
};
