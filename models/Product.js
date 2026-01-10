const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    nameAr: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    oldPrice: {
        type: Number,
        default: null
    },
    description: {
        type: String,
        default: ''
    },
    descriptionAr: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    badge: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
