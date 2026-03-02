const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// @desc    Get inventory movements
// @route   GET /api/inventory
// @access  Private
const getInventoryMovements = async (req, res) => {
    try {
        const { productId, type, startDate, endDate } = req.query;
        let query = {};

        if (productId) {
            query.productId = productId;
        }

        if (type) {
            query.type = type;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const movements = await Inventory.find(query)
            .populate('productId', 'name sku')
            .populate('updatedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json(movements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get inventory for a specific product
// @route   GET /api/inventory/product/:productId
// @access  Private
const getProductInventory = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const movements = await Inventory.find({ productId: req.params.productId })
            .populate('updatedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json({
            product,
            movements,
            currentStock: product.currentStock
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get low stock products
// @route   GET /api/inventory/low-stock
// @access  Private
const getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ['$currentStock', '$minStockLevel'] }
        }).populate('categoryId', 'name');

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create inventory adjustment
// @route   POST /api/inventory/adjust
// @access  Private
const adjustInventory = async (req, res) => {
    try {
        const { productId, quantity, type, notes } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.currentStock;
        product.currentStock += quantity;

        if (product.currentStock < 0) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        await product.save();

        const movement = await Inventory.create({
            productId,
            type: type || 'adjustment',
            quantity,
            previousStock,
            newStock: product.currentStock,
            notes,
            updatedBy: req.user._id
        });

        res.status(201).json({
            message: 'Inventory adjusted successfully',
            movement,
            currentStock: product.currentStock
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get inventory summary
// @route   GET /api/inventory/summary
// @access  Private/Admin
const getInventorySummary = async (req, res) => {
    try {
        const products = await Product.find();

        const summary = {
            totalProducts: products.length,
            totalStock: products.reduce((sum, p) => sum + p.currentStock, 0),
            lowStockCount: products.filter(p => p.currentStock <= p.minStockLevel).length,
            totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0)
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInventoryMovements,
    getProductInventory,
    getLowStockProducts,
    adjustInventory,
    getInventorySummary
};
