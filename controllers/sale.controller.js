const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
    try {
        const { startDate, endDate, cashierId } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        if (cashierId) {
            query.cashierId = cashierId;
        }

        const sales = await Sale.find(query)
            .populate('cashierId', 'fullName')
            .sort({ createdAt: -1 });

        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('cashierId', 'fullName')
            .populate('items.productId');

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create sale (POS transaction)
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
    try {
        const { items, customerName, customerPhone, discount, paymentMethod } = req.body;

        // Fetch all products and validate stock in one pass
        const productMap = {};
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productId}` });
            }
            if (product.currentStock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for "${product.name}". Available: ${product.currentStock}`
                });
            }
            productMap[item.productId] = product;
            // Attach product name and calculate subtotal
            item.name = product.name;
            item.subtotal = item.quantity * item.price;
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const discountAmount = discount || 0;
        const tax = (subtotal - discountAmount) * 0.1; // 10% tax
        const total = subtotal - discountAmount + tax;

        // Create sale
        const sale = await Sale.create({
            items,
            customerName: customerName || 'Walk-in Customer',
            customerPhone,
            subtotal,
            discount: discountAmount,
            tax,
            total,
            paymentMethod,
            cashierId: req.user._id
        });

        // Update stock and create inventory records using the cached productMap
        for (const item of items) {
            const product = productMap[item.productId];
            const previousStock = product.currentStock;
            product.currentStock -= item.quantity;
            await product.save();

            await Inventory.create({
                productId: product._id,
                type: 'sale',
                quantity: -item.quantity,
                reference: sale.receiptNo,
                referenceId: sale._id,
                previousStock,
                newStock: product.currentStock,
                notes: `Sale: ${sale.receiptNo}`,
                updatedBy: req.user._id
            });
        }

        // Update customer loyalty if phone matches a registered customer
        if (customerPhone) {
            const customer = await Customer.findOne({ phone: customerPhone });
            if (customer) {
                customer.totalSpent += total;
                customer.lastPurchase = new Date();
                customer.loyaltyPoints += Math.floor(total / 10); // 1 point per $10 spent
                await customer.save();
            }
        }

        res.status(201).json(sale);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get today's sales summary
// @route   GET /api/sales/today/summary
// @access  Private
const getTodaySummary = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const sales = await Sale.find({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const summary = {
            totalSales: sales.length,
            totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
            totalItems: sales.reduce((sum, sale) =>
                sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
            ),
            byPaymentMethod: {
                cash: sales.filter(s => s.paymentMethod === 'cash').length,
                card: sales.filter(s => s.paymentMethod === 'card').length,
                mobile: sales.filter(s => s.paymentMethod === 'mobile').length
            }
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get sales report
// @route   GET /api/sales/report
// @access  Private/Admin
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const report = await Sale.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: 1 },
                    revenue: { $sum: "$total" },
                    itemsSold: { $sum: { $size: "$items" } }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSales,
    getSaleById,
    createSale,
    getTodaySummary,
    getSalesReport
};
