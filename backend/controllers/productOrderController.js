import productOrderModel from '../models/productOrderModel.js';
import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';

// Place a new product order
export const placeProductOrder = async (req, res, next) => {
  try {
    const { advisorId, farmerId, items, totalAmount } = req.body;

    if (!advisorId || !farmerId || !items || items.length === 0 || !totalAmount) {
      return res.json({ success: false, message: 'Missing Order Details' });
    }

    // Verify farmer exists and belongs to this advisor
    const farmer = await userModel.findOne({ _id: farmerId, assignedAdvisor: advisorId, role: 'farmer' });
    if (!farmer) {
      return res.json({ success: false, message: 'Farmer not found or not assigned to you' });
    }

    // Process order items and decrement stock
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (product) {
        if (product.stock < item.quantity) {
          return res.json({ success: false, message: `Insufficient stock for ${product.name}` });
        }
        product.stock -= item.quantity;
        await product.save();
      }
    }

    const newOrder = new productOrderModel({
      advisorId,
      farmerId,
      items,
      totalAmount,
      date: Date.now()
    });

    await newOrder.save();

    res.json({ success: true, message: 'Order Placed Successfully', order: newOrder });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Pay for a product order
export const payProductOrder = async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;
    await productOrderModel.findByIdAndUpdate(orderId, {
      payment: true,
      paymentDate: Date.now(),
      paymentMethod: paymentMethod ? (paymentMethod === 'qr' ? 'UPI / QR' : paymentMethod === 'cash' ? 'Cash' : paymentMethod) : 'Cash'
    });
    res.json({ success: true, message: 'Payment Successful' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// List orders for an advisor
export const getAdvisorProductOrders = async (req, res, next) => {
  try {
    const { advisorId } = req.body;
    const orders = await productOrderModel.find({ advisorId }).sort({ createdAt: -1 });

    // Populate farmer data manually or using mongoose
    const ordersWithFarmers = await Promise.all(orders.map(async (order) => {
      const farmer = await userModel.findById(order.farmerId).select('farmerName firstName lastName phone village');
      return {
        ...order.toObject(),
        farmerName: farmer ? (farmer.farmerName || `${farmer.firstName || ''} ${farmer.lastName || ''}`.trim()) : 'Unknown Farmer'
      };
    }));

    res.json({ success: true, orders: ordersWithFarmers });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
