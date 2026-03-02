const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const { category, search, lowStock } = req.query;
        let query = { isActive: true };

        if (category) {
            query.categoryId = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        if (lowStock === 'true') {
            query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
        }

        const products = await Product.find(query)
            .populate('categoryId', 'name')
            .sort('-createdAt');

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId', 'name');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        // Validate Category
        const category = await Category.findById(req.body.categoryId);
        if (!category) {
            return res.status(400).json({ message: 'Invalid Category ID' });
        }

        const product = await Product.create(req.body);

        // Create initial inventory record
        await Inventory.create({
            productId: product._id,
            type: 'adjustment',
            quantity: product.currentStock,
            previousStock: 0,
            newStock: product.currentStock,
            notes: 'Initial stock entry',
            updatedBy: req.user._id
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // If category is being updated, validate it
        if (req.body.categoryId && req.body.categoryId !== product.categoryId.toString()) {
            const category = await Category.findById(req.body.categoryId);
            if (!category) return res.status(400).json({ message: 'Invalid Category ID' });
        }

        const oldStock = product.currentStock;

        // Update product
        Object.assign(product, req.body);
        const updatedProduct = await product.save();

        // If stock was modified directly in the update, track it
        if (req.body.currentStock !== undefined && oldStock !== updatedProduct.currentStock) {
            await Inventory.create({
                productId: updatedProduct._id,
                type: 'adjustment',
                quantity: updatedProduct.currentStock - oldStock,
                previousStock: oldStock,
                newStock: updatedProduct.currentStock,
                notes: req.body.adjustmentNotes || 'Manual stock update',
                updatedBy: req.user._id
            });
        }

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Logic for soft delete if needed, or hard delete
        await product.deleteOne();

        res.json({ message: 'Product removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private
const updateStock = async (req, res) => {
    try {
        const { quantity, type, notes } = req.body; // quantity can be positive or negative

        if (quantity === 0) {
            return res.status(400).json({ message: 'Quantity cannot be zero' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const previousStock = product.currentStock;
        const newStock = previousStock + quantity;

        if (newStock < 0) {
            return res.status(400).json({ message: 'Transaction would result in negative stock' });
        }

        product.currentStock = newStock;
        await product.save();

        // Create inventory record
        await Inventory.create({
            productId: product._id,
            type: type || 'adjustment',
            quantity: quantity,
            previousStock,
            newStock: product.currentStock,
            notes: notes || 'Stock adjustment',
            updatedBy: req.user._id
        });

        res.json({
            message: 'Stock updated successfully',
            currentStock: product.currentStock
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get low stock products
// @route   GET /api/products/low-stock
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

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts
};
