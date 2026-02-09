export const EmailTemplates = {
  welcome: (name: string) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Welcome to SoleTrade!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering with SoleTrade. Your account has been successfully created.</p>
      <p>You can now browse our catalog and submit inquiries.</p>
      <br/>
      <p>Best regards,</p>
      <p>The SoleTrade Team</p>
    </div>
  `,

  inquiryQuoted: (inquiryNo: string, inquiryId: string) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Inquiry Update</h2>
      <p>Your inquiry <strong>${inquiryNo}</strong> has been quoted.</p>
      <p>Please log in to your dashboard to review the quote and place an order.</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/inquiries/${inquiryId}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Quote</a></p>
      <br/>
      <p>Best regards,</p>
      <p>The SoleTrade Team</p>
    </div>
  `,

  orderConfirmation: (name: string, orderNo: string, amount: number) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Order Confirmation</h2>
      <p>Dear ${name},</p>
      <p>We have received your order <strong>${orderNo}</strong>.</p>
      <p>Total Amount: <strong>$${amount.toFixed(2)}</strong></p>
      <p>We will process it shortly and notify you of any updates.</p>
      <br/>
      <p>Best regards,</p>
      <p>The SoleTrade Team</p>
    </div>
  `,

  orderStatusUpdate: (
    name: string,
    orderNo: string,
    status: string,
    orderId: string,
  ) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Order Status Update</h2>
      <p>Dear ${name},</p>
      <p>Your order <strong>${orderNo}</strong> status has been updated to: <span style="font-weight: bold; color: #007bff;">${status}</span>.</p>
      <p><a href="${process.env.FRONTEND_URL}/dashboard/orders/${orderId}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Order</a></p>
      <br/>
      <p>Best regards,</p>
      <p>The SoleTrade Team</p>
    </div>
  `,

  adminNewOrder: (orderNo: string, amount: number) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>New Order Received</h2>
      <p>Order <strong>${orderNo}</strong> has been placed.</p>
      <p>Total: <strong>$${amount.toFixed(2)}</strong></p>
      <p>Please review and process via the Admin Dashboard.</p>
    </div>
  `,

  paymentApproved: (name: string, orderNo: string, amount: number) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Payment Approved</h2>
      <p>Dear ${name},</p>
      <p>We have received your payment of <strong>$${amount.toFixed(2)}</strong> for order <strong>${orderNo}</strong>.</p>
      <p>Your order is now being processed.</p>
      <br/>
      <p>Best regards,</p>
      <p>The SoleTrade Team</p>
    </div>
  `,

  shippingUpdate: (
    name: string,
    orderNo: string,
    carrier: string,
    trackingNo: string,
  ) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Order Shipped</h2>
      <p>Dear ${name},</p>
      <p>Your order <strong>${orderNo}</strong> has been shipped via <strong>${carrier}</strong>.</p>
      <p>Tracking Number: <strong>${trackingNo}</strong></p>
      <br/>
      <p>Best regards,</p>
      <p>The SoleTrade Team</p>
    </div>
  `,

  adminNewInquiry: (inquiryNo: string, contactName: string) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>New Inquiry Received</h2>
      <p>Inquiry <strong>${inquiryNo}</strong> has been submitted by ${contactName}.</p>
      <p>Please review and provide a quote via the Admin Dashboard.</p>
    </div>
  `,
};
