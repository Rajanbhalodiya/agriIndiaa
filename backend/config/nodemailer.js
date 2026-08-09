import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: `"Rajan Farm Support" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
            to: email,
            subject: 'Rajan Farm - Password Reset Verification Code (OTP)',
            html: `
                <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #ff9200; padding-bottom: 15px; margin-bottom: 20px;">
                        <h1 style="color: #2e7d32; margin: 0; font-size: 28px;">Rajan <span style="color: #ff9200;">Farm</span></h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Direct From Talala Gir Orchard</p>
                    </div>
                    
                    <h2 style="color: #333333; font-size: 20px;">Password Reset Request</h2>
                    <p style="color: #555555; line-height: 1.6; font-size: 16px;">
                        We received a request to reset the password for your Rajan Farm account. Use the verification code (OTP) below to reset your password. This code is valid for <strong>5 minutes</strong>.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #ff9200; letter-spacing: 6px; padding: 12px 30px; border: 2px dashed #ff9200; border-radius: 8px; background-color: #fffaf0;">
                            ${otp}
                        </span>
                    </div>
                    
                    <p style="color: #777777; font-size: 14px; line-height: 1.6;">
                        If you did not request a password reset, please ignore this email or contact support if you have security concerns.
                    </p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; font-size: 12px; color: #999999;">
                        <p style="margin: 0;">© 2026 Rajan Farm. All rights reserved.</p>
                        <p style="margin: 5px 0 0 0;">Talala Gir, Gujarat, India</p>
                    </div>
                </div>
            `
        }

        const info = await transporter.sendMail(mailOptions)
        console.log(`[nodemailer] Email sent successfully to ${email}. MessageId: ${info.messageId}`)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('[nodemailer] Failed to send email:', error)
        throw new Error(`Email delivery failed: ${error.message}`)
    }
}

const sendOrderConfirmationEmail = async (email, orderDetails) => {
    try {
        const mailOptions = {
            from: `"Rajan Farm Orders" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
            to: email,
            subject: `Order Confirmed! Receipt for Order #${orderDetails.orderId}`,
            html: `
                <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #ff9200; padding-bottom: 15px; margin-bottom: 20px;">
                        <h1 style="color: #2e7d32; margin: 0; font-size: 28px;">Rajan <span style="color: #ff9200;">Farm</span></h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Direct From Talala Gir Orchard</p>
                    </div>
                    
                    <h2 style="color: #2e7d32; font-size: 20px; text-align: center; margin-bottom: 5px;">Order Confirmed!</h2>
                    <p style="color: #555555; line-height: 1.6; font-size: 16px; text-align: center; margin-top: 0;">
                        Thank you for your order, <strong>${orderDetails.userName}</strong>! Your booking for premium Talala Gir Kesar mangoes is confirmed.
                    </p>
                    
                    <div style="background-color: #fcfcfc; border: 1px solid #eeeeee; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 8px; font-size: 16px;">Order Summary</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #555555;">
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Order ID:</td>
                                <td style="padding: 6px 0; text-align: right;">#${orderDetails.orderId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Product:</td>
                                <td style="padding: 6px 0; text-align: right;">${orderDetails.productName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Amount Paid:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2e7d32;">₹${orderDetails.amount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Delivery Date:</td>
                                <td style="padding: 6px 0; text-align: right;">${orderDetails.slotDate}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Delivery Slot Time:</td>
                                <td style="padding: 6px 0; text-align: right;">${orderDetails.slotTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Payment Method:</td>
                                <td style="padding: 6px 0; text-align: right;">${orderDetails.paymentMethod}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="color: #777777; font-size: 14px; line-height: 1.6; text-align: center;">
                        We will notify you once your mango boxes are packed and dispatched directly from our Talala Gir orchard.
                    </p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; font-size: 12px; color: #999999;">
                        <p style="margin: 0;">© 2026 Rajan Farm. All rights reserved.</p>
                        <p style="margin: 5px 0 0 0;">Talala Gir, Gujarat, India</p>
                    </div>
                </div>
            `
        }

        const info = await transporter.sendMail(mailOptions)
        console.log(`[nodemailer] Order confirmation email sent to ${email}. MessageId: ${info.messageId}`)
        return { success: true }
    } catch (error) {
        console.error('[nodemailer] Failed to send order confirmation email:', error)
    }
}

const sendOrderCancellationEmail = async (email, orderDetails) => {
    try {
        const mailOptions = {
            from: `"Rajan Farm Support" <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
            to: email,
            subject: `Order Cancelled - Order #${orderDetails.orderId}`,
            html: `
                <div style="font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #d32f2f; padding-bottom: 15px; margin-bottom: 20px;">
                        <h1 style="color: #2e7d32; margin: 0; font-size: 28px;">Rajan <span style="color: #ff9200;">Farm</span></h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Direct From Talala Gir Orchard</p>
                    </div>
                    
                    <h2 style="color: #d32f2f; font-size: 20px; text-align: center; margin-bottom: 5px;">Order Cancelled</h2>
                    <p style="color: #555555; line-height: 1.6; font-size: 16px; text-align: center; margin-top: 0;">
                        Hello <strong>${orderDetails.userName}</strong>, your order #${orderDetails.orderId} has been cancelled by the admin.
                    </p>
                    
                    <div style="background-color: #fcfcfc; border: 1px solid #eeeeee; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333333; border-bottom: 1px solid #eeeeee; padding-bottom: 8px; font-size: 16px;">Cancellation Summary</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #555555;">
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Order ID:</td>
                                <td style="padding: 6px 0; text-align: right;">#${orderDetails.orderId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Product:</td>
                                <td style="padding: 6px 0; text-align: right;">${orderDetails.productName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Amount:</td>
                                <td style="padding: 6px 0; text-align: right;">₹${orderDetails.amount}</td>
                            </tr>
                            ${orderDetails.isRefundable ? `
                            <tr style="background-color: #ffebee;">
                                <td style="padding: 8px; font-weight: bold; color: #c62828;">Refund Status:</td>
                                <td style="padding: 8px; text-align: right; font-weight: bold; color: #c62828;">Refund Initiated</td>
                            </tr>
                            <tr style="background-color: #ffebee;">
                                <td style="padding: 8px; font-weight: bold; color: #c62828;">Estimated Refund Date:</td>
                                <td style="padding: 8px; text-align: right; font-weight: bold; color: #c62828;">${orderDetails.refundDate}</td>
                            </tr>
                            ` : `
                            <tr>
                                <td style="padding: 6px 0; font-weight: bold; color: #333333;">Refund Status:</td>
                                <td style="padding: 6px 0; text-align: right; color: #777;">No refund required (COD / Unpaid)</td>
                            </tr>
                            `}
                        </table>
                    </div>
                    
                    <p style="color: #777777; font-size: 14px; line-height: 1.6; text-align: center;">
                        If you have any questions or concerns regarding this cancellation, please contact our support team.
                    </p>
                    
                    <div style="margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; font-size: 12px; color: #999999;">
                        <p style="margin: 0;">© 2026 Rajan Farm. All rights reserved.</p>
                        <p style="margin: 5px 0 0 0;">Talala Gir, Gujarat, India</p>
                    </div>
                </div>
            `
        }

        const info = await transporter.sendMail(mailOptions)
        console.log(`[nodemailer] Order cancellation email sent to ${email}. MessageId: ${info.messageId}`)
        return { success: true }
    } catch (error) {
        console.error('[nodemailer] Failed to send order cancellation email:', error)
    }
}

export { sendOTPEmail, sendOrderConfirmationEmail, sendOrderCancellationEmail }
