const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) query.orderDate.$lte = new Date(endDate);
        }

        const purchases = await Purchase.find(query)
            .populate('supplierId', 'name')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
const getPurchaseById = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('supplierId')
            .populate('createdBy', 'fullName')
            .populate('items.productId');

        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Private
const createPurchase = async (req, res) => {
    try {
        const purchaseData = {
            ...req.body,
            createdBy: req.user._id
        };

        const purchase = await Purchase.create(purchaseData);

        // Only update stock if status is immediately 'received' on creation
        if (purchase.status === 'received') {
            await updateStockForPurchase(purchase, req.user._id);
        }

        res.status(201).json(purchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update purchase status
// @route   PUT /api/purchases/:id/status
// @access  Private
const updatePurchaseStatus = async (req, res) => {
    try {
        const { status, receivedDate } = req.body;
        const purchase = await Purchase.findById(req.params.id);

        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        // GUARD: Prevent re-receiving an already received purchase (double stock bug)
        if (status === 'received' && purchase.status === 'received') {
            return res.status(400).json({ message: 'Purchase has already been received' });
        }

        const previousStatus = purchase.status;
        purchase.status = status;

        if (status === 'received') {
            purchase.receivedDate = receivedDate || new Date();
            await updateStockForPurchase(purchase, req.user._id);
        }

        await purchase.save();
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper: update stock and create inventory records for all items in a purchase
const updateStockForPurchase = async (purchase, userId) => {
    for (const item of purchase.items) {
        const product = await Product.findById(item.productId);
        if (product) {
            const previousStock = product.currentStock;
            product.currentStock += item.quantity;
            await product.save();

            await Inventory.create({
                productId: product._id,
                type: 'purchase',
                quantity: item.quantity,
                reference: purchase.purchaseOrderNo,
                referenceId: purchase._id,
                previousStock,
                newStock: product.currentStock,
                notes: `Purchase received: ${purchase.purchaseOrderNo}`,
                updatedBy: userId
            });
        }
    }
};

// @desc    Get purchase summary
// @route   GET /api/purchases/summary
// @access  Private/Admin
const getPurchaseSummary = async (req, res) => {
    try {
        const summary = await Purchase.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(summary[0] || { totalAmount: 0, count: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchaseStatus,
    getPurchaseSummary
};
