import logger from './logger.js';

/**
 * Real-Time SMS Service
 * Dispatches real SMS messages to recipient phone numbers using Fast2SMS / Gateway API
 */
export const sendSMS = async (options) => {
  const { phone, message } = options;
  if (!phone || !message) return;

  const fast2smsKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;

  if (fast2smsKey && fast2smsKey.trim() !== '') {
    try {
      // Extract 10-digit Indian mobile number
      let cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(-10);
      }

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: cleanPhone
        })
      });

      const data = await response.json();
      if (data.return) {
        logger.info(`[Real SMS Delivered] Sent to ${cleanPhone} via Fast2SMS`);
        return { success: true, data };
      } else {
        logger.error(`[Fast2SMS Delivery Failed]: ${data.message || JSON.stringify(data)}`);
      }
    } catch (err) {
      logger.error('Error dispatching real SMS via Fast2SMS:', err.message);
    }
  }

  // Default logger output if no SMS API key is configured
  logger.info(`[SMS Dispatch to ${phone}]: ${message}`);
};
