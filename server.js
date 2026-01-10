const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddtl6gs9k',
    api_key: process.env.CLOUDINARY_API_KEY || '474698471155164',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'g65AVvsZK_3R_PSL8koVoJi8nVc'
});

// Load models
const Product = require('./models/Product');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bionobel:shop2024@cluster0.mech8jq.mongodb.net/bionobel_shop?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully!');
        initializeProducts();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️ Running without database - data will not persist!');
    });

// Initial products to seed database
const initialProducts = [
    {
        productId: 1,
        name: "عسل طبيعي",
        nameAr: "عسل طبيعي",
        price: 2500,
        oldPrice: 3000,
        description: "عسل طبيعي 100% من جبال الأطلس",
        descriptionAr: "عسل طبيعي 100% من جبال الأطلس",
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",
        badge: "الأكثر مبيعاً"
    },
    {
        productId: 2,
        name: "زيت الأركان",
        nameAr: "زيت الأركان",
        price: 3500,
        oldPrice: null,
        description: "زيت أركان أصلي للبشرة والشعر",
        descriptionAr: "زيت أركان أصلي للبشرة والشعر",
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400",
        badge: ""
    },
    {
        productId: 3,
        name: "زيت الحبة السوداء",
        nameAr: "زيت الحبة السوداء",
        price: 2000,
        oldPrice: 2500,
        description: "زيت حبة البركة الطبيعي",
        descriptionAr: "زيت حبة البركة الطبيعي",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
        badge: "عرض خاص"
    },
    {
        productId: 4,
        name: "باك بيو الكامل",
        nameAr: "باك بيو الكامل",
        price: 7500,
        oldPrice: 9000,
        description: "مجموعة كاملة من المنتجات الطبيعية",
        descriptionAr: "مجموعة كاملة من المنتجات الطبيعية",
        image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
        badge: "الأفضل قيمة"
    },
    {
        productId: 5,
        name: "ماء الورد",
        nameAr: "ماء الورد",
        price: 800,
        oldPrice: null,
        description: "ماء ورد طبيعي للبشرة",
        descriptionAr: "ماء ورد طبيعي للبشرة",
        image: "https://images.unsplash.com/photo-1518882605630-8ed31f34bf51?w=400",
        badge: ""
    },
    {
        productId: 6,
        name: "زيت الزيتون البكر",
        nameAr: "زيت الزيتون البكر",
        price: 1800,
        oldPrice: null,
        description: "زيت زيتون بكر ممتاز",
        descriptionAr: "زيت زيتون بكر ممتاز",
        image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
        badge: ""
    },
    {
        productId: 7,
        name: "زيت جوز الهند",
        nameAr: "زيت جوز الهند",
        price: 1500,
        oldPrice: 1800,
        description: "زيت جوز الهند العضوي",
        descriptionAr: "زيت جوز الهند العضوي",
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400",
        badge: ""
    },
    {
        productId: 8,
        name: "خلطة أعشاب طبيعية",
        nameAr: "خلطة أعشاب طبيعية",
        price: 600,
        oldPrice: null,
        description: "خلطة أعشاب للشاي الصحي",
        descriptionAr: "خلطة أعشاب للشاي الصحي",
        image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
        badge: "جديد"
    }
];

// Initialize products in database if empty
async function initializeProducts() {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(initialProducts);
            console.log('✅ Initial products added to database');
        } else {
            console.log(`📦 Found ${count} products in database`);
        }
    } catch (error) {
        console.error('Error initializing products:', error);
    }
}

// Email configuration
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: 'ferhaouiy10@gmail.com',
        pass: 'ycwe limk pake aisl'
    }
};

// Admin credentials
const ADMIN_CONFIG = {
    username: 'admin',
    password: 'shop2024'
};

// Create email transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));
app.use('/product-images', express.static('product-images'));
app.use('/order-images', express.static('order-images'));

// Create necessary directories
if (!fs.existsSync('product-images')) {
    fs.mkdirSync('product-images', { recursive: true });
}
if (!fs.existsSync('order-images')) {
    fs.mkdirSync('order-images', { recursive: true });
}

// Format price in DZD
function formatPriceDZD(price) {
    return price.toLocaleString('ar-DZ') + ' د.ج';
}

// Send order notification email
async function sendOrderEmail(order) {
    const itemsList = order.items.map(item => 
        `<tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${item.nameAr || item.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">${formatPriceDZD(item.price)}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: left;">${formatPriceDZD(item.price * item.quantity)}</td>
        </tr>`
    ).join('');

    const emailHtml = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5a2b 0%, #c9a227 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">🛒 طلب جديد!</h1>
            <p style="margin: 10px 0 0 0;">Bionobel - البديل الصحي</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: #8b5a2b; border-bottom: 2px solid #c9a227; padding-bottom: 10px;">معلومات الطلب</h2>
            <p><strong>رقم الطلب:</strong> ${order.orderId}</p>
            <p><strong>التاريخ:</strong> ${new Date(order.date).toLocaleString('ar-DZ')}</p>
            
            <h2 style="color: #8b5a2b; border-bottom: 2px solid #c9a227; padding-bottom: 10px; margin-top: 20px;">معلومات العميل</h2>
            <p><strong>الاسم:</strong> ${order.customer.firstName} ${order.customer.lastName}</p>
            <p><strong>الهاتف:</strong> ${order.customer.phone}</p>
            <p><strong>البريد:</strong> ${order.customer.email}</p>
            <p><strong>الولاية:</strong> ${order.customer.wilaya || 'غير محدد'}</p>
            <p><strong>العنوان:</strong> ${order.customer.address || 'غير محدد'}</p>
            
            <h2 style="color: #8b5a2b; border-bottom: 2px solid #c9a227; padding-bottom: 10px; margin-top: 20px;">المنتجات</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background: #8b5a2b; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd;">المنتج</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">الكمية</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">السعر</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsList}
                </tbody>
            </table>
            
            <div style="background: #8b5a2b; color: white; padding: 15px; margin-top: 20px; border-radius: 5px; text-align: center;">
                <h2 style="margin: 0;">المجموع الكلي: ${formatPriceDZD(order.totalPrice)}</h2>
            </div>
        </div>
        
        <div style="background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">Bionobel - البديل الصحي لبيع التوابل والأدوية الطبيعية</p>
        </div>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Bionobel Shop" <${EMAIL_CONFIG.auth.user}>`,
            to: EMAIL_CONFIG.auth.user,
            subject: `🛒 طلب جديد #${order.orderId} - ${order.customer.firstName} ${order.customer.lastName}`,
            html: emailHtml
        });
        console.log('✅ Email notification sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
    }
}

// Admin authentication middleware
function adminAuth(req, res, next) {
    const { username, password } = req.body;
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
}

// API: Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// API: Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ productId: 1 });
        // Transform to match expected format
        const formattedProducts = products.map(p => ({
            id: p.productId,
            name: p.name,
            nameAr: p.nameAr,
            price: p.price,
            oldPrice: p.oldPrice,
            description: p.description,
            descriptionAr: p.descriptionAr,
            image: p.image,
            badge: p.badge
        }));
        res.json(formattedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// API: Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ productId: parseInt(req.params.id) });
        if (product) {
            res.json({
                id: product.productId,
                name: product.name,
                nameAr: product.nameAr,
                price: product.price,
                oldPrice: product.oldPrice,
                description: product.description,
                descriptionAr: product.descriptionAr,
                image: product.image,
                badge: product.badge
            });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// API: Add product (Admin)
app.post('/api/products/add', async (req, res) => {
    try {
        const { nameAr, price, oldPrice, descriptionAr, badge, image } = req.body;
        
        // Get next product ID
        const lastProduct = await Product.findOne().sort({ productId: -1 });
        const newId = lastProduct ? lastProduct.productId + 1 : 1;
        
        // Upload image to Cloudinary if base64
        let imageUrl = '';
        if (image && image.startsWith('data:image')) {
            try {
                const uploadResult = await cloudinary.uploader.upload(image, {
                    folder: 'bionobel-products',
                    public_id: `product-${newId}-${Date.now()}`
                });
                imageUrl = uploadResult.secure_url;
                console.log('✅ Image uploaded to Cloudinary:', imageUrl);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError.message);
                imageUrl = image; // Fallback to base64 if upload fails
            }
        } else if (image) {
            imageUrl = image; // Keep URL as is
        }
        
        const newProduct = new Product({
            productId: newId,
            name: nameAr,
            nameAr,
            price: parseInt(price),
            oldPrice: oldPrice ? parseInt(oldPrice) : null,
            description: descriptionAr,
            descriptionAr,
            image: imageUrl,
            badge: badge || ""
        });
        
        await newProduct.save();
        
        res.json({ 
            success: true, 
            product: {
                id: newProduct.productId,
                name: newProduct.name,
                nameAr: newProduct.nameAr,
                price: newProduct.price,
                oldPrice: newProduct.oldPrice,
                description: newProduct.description,
                descriptionAr: newProduct.descriptionAr,
                image: newProduct.image,
                badge: newProduct.badge
            }
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// API: Update product (Admin)
app.put('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { nameAr, price, oldPrice, descriptionAr, badge, image } = req.body;
        
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Upload new image to Cloudinary if base64, keep old if not changed
        let imageUrl = product.image;
        if (image && image.startsWith('data:image')) {
            try {
                const uploadResult = await cloudinary.uploader.upload(image, {
                    folder: 'bionobel-products',
                    public_id: `product-${productId}-${Date.now()}`
                });
                imageUrl = uploadResult.secure_url;
                console.log('✅ Image updated on Cloudinary:', imageUrl);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError.message);
                imageUrl = image; // Fallback to base64 if upload fails
            }
        } else if (image) {
            imageUrl = image; // Keep URL as is
        }
        
        product.name = nameAr;
        product.nameAr = nameAr;
        product.price = parseInt(price);
        product.oldPrice = oldPrice ? parseInt(oldPrice) : null;
        product.description = descriptionAr;
        product.descriptionAr = descriptionAr;
        product.image = imageUrl;
        product.badge = badge || "";
        
        await product.save();
        
        res.json({ 
            success: true, 
            product: {
                id: product.productId,
                name: product.name,
                nameAr: product.nameAr,
                price: product.price,
                oldPrice: product.oldPrice,
                description: product.description,
                descriptionAr: product.descriptionAr,
                image: product.image,
                badge: product.badge
            }
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// API: Delete product (Admin)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const result = await Product.deleteOne({ productId });
        
        if (result.deletedCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// API: Create order
app.post('/api/orders', async (req, res) => {
    try {
        const { customer, items, totalPrice, productImage } = req.body;
        
        // Validate required fields
        if (!customer || !customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
            return res.status(400).json({ error: 'All customer fields are required' });
        }
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }
        
        // Create new order
        const orderId = Date.now();
        
        let imageName = '';
        // Save product image if provided
        if (productImage) {
            imageName = `order-${orderId}.png`;
            const base64Data = productImage.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFileSync(`order-images/${imageName}`, base64Data, 'base64');
        }
        
        const newOrder = new Order({
            orderId,
            date: new Date(),
            customer: {
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                wilaya: customer.wilaya || '',
                address: customer.address || ''
            },
            items: items,
            totalPrice: totalPrice,
            status: 'pending',
            image: imageName
        });
        
        await newOrder.save();
        
        // Show notification in console
        console.log('\n========================================');
        console.log('🔔 طلب جديد!');
        console.log('========================================');
        console.log(`رقم الطلب: ${orderId}`);
        console.log(`العميل: ${customer.firstName} ${customer.lastName}`);
        console.log(`الهاتف: ${customer.phone}`);
        console.log(`البريد: ${customer.email}`);
        console.log(`الولاية: ${customer.wilaya || 'غير محدد'}`);
        console.log(`العنوان: ${customer.address || 'غير محدد'}`);
        console.log(`المجموع: ${formatPriceDZD(totalPrice)}`);
        console.log('المنتجات:');
        items.forEach(item => {
            console.log(`  - ${item.nameAr || item.name} x${item.quantity} = ${formatPriceDZD(item.price * item.quantity)}`);
        });
        console.log('========================================\n');
        
        // Send email notification
        sendOrderEmail(newOrder);
        
        res.json({ success: true, orderId: orderId, message: 'تم إرسال الطلب بنجاح!' });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'فشل في إرسال الطلب' });
    }
});

// API: Get all orders (for admin)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        // Transform to match expected format
        const formattedOrders = orders.map(o => ({
            id: o.orderId,
            date: o.date,
            customer: o.customer,
            items: o.items,
            totalPrice: o.totalPrice,
            status: o.status,
            image: o.image
        }));
        res.json(formattedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// API: Track order (for customers)
app.get('/api/orders/track/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await Order.findOne({ orderId });
        
        if (!order) {
            return res.json({ found: false });
        }
        
        // Return limited info for privacy
        res.json({
            found: true,
            orderId: order.orderId,
            date: order.date,
            status: order.status,
            customerName: `${order.customer.firstName} ${order.customer.lastName}`,
            totalPrice: order.totalPrice,
            itemsCount: order.items.length
        });
    } catch (error) {
        console.error('Error tracking order:', error);
        res.status(500).json({ error: 'Failed to track order' });
    }
});

// API: Update order status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;
        
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        order.status = status;
        await order.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// API: Delete order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Delete associated image if exists
        if (order.image) {
            const imagePath = `order-images/${order.image}`;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await Order.deleteOne({ orderId });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint (for UptimeRobot)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🛒 BIONOBEL SHOP SERVER STARTED');
    console.log('========================================');
    console.log(`Shop URL: http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log('========================================');
    console.log('Waiting for orders...');
    console.log('');
});
