const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: Number,
    name: String,
    nameAr: String,
    price: Number,
    quantity: Number,
    image: String
});

const orderSchema = new mongoose.Schema({
    orderId: {
        type: Number,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    customer: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        wilaya: {
            type: String,
            default: ''
        },
        address: {
            type: String,
            default: ''
        }
    },
    items: [orderItemSchema],
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'shipped', 'delivered', 'rejected'],
        default: 'pending'
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
