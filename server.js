const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// EMAIL CONFIGURATION - UPDATE THESE SETTINGS
// ============================================
const EMAIL_CONFIG = {
    // Your email address where you want to receive orders
    receiverEmail: process.env.EMAIL_RECEIVER || 'ferhaouiy10@gmail.com',
    
    // Gmail account to SEND emails from (can be the same as receiver)
    // You need to create an "App Password" for this to work
    senderEmail: process.env.EMAIL_SENDER || 'ferhaouiy10@gmail.com',
    
    // App Password from Google (NOT your regular password)
    // To get an App Password:
    // 1. Go to https://myaccount.google.com/security
    // 2. Enable 2-Step Verification if not already enabled
    // 3. Go to "App passwords" (search for it)
    // 4. Create a new app password for "Mail"
    // 5. Copy the 16-character password and paste it below
    appPassword: process.env.EMAIL_PASSWORD || 'ycwe limk pake aisl'
};

// ============================================
// ADMIN CREDENTIALS - CHANGE THESE!
// ============================================
const ADMIN_CONFIG = {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASS || 'shop2024'  // CHANGE THIS to a strong password!
};

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_CONFIG.senderEmail,
        pass: EMAIL_CONFIG.appPassword
    }
});

// Format price in DZD
function formatPriceDZD(price) {
    return price.toLocaleString('ar-DZ') + ' د.ج';
}

// Function to send order email
async function sendOrderEmail(order) {
    // Build items list HTML
    const itemsList = order.items.map(item => 
        `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.nameAr || item.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${formatPriceDZD(item.price)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${formatPriceDZD(item.price * item.quantity)}</td>
        </tr>`
    ).join('');

    const emailHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.8; color: #333; direction: rtl; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e94560 0%, #c73e54 100%); color: white; padding: 25px; text-align: center; border-radius: 15px 15px 0 0; }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 25px; border: 1px solid #ddd; }
            .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 12px; border: 1px solid #eee; }
            .section h3 { margin-top: 0; color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 12px; font-size: 18px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; }
            .info-value { font-weight: bold; color: #1a1a2e; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #1a1a2e; color: white; padding: 12px; text-align: center; }
            .total { font-size: 22px; color: #e94560; font-weight: bold; text-align: center; padding: 20px; background: #fff5f7; border-radius: 10px; margin-top: 15px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 15px 15px; }
            .btn { display: inline-block; padding: 12px 25px; background: #e94560; color: white; text-decoration: none; border-radius: 25px; margin: 5px; font-weight: bold; }
            .btn:hover { background: #c73e54; }
            .wilaya-badge { background: #e94560; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛒 طلب جديد!</h1>
                <p style="margin: 0; opacity: 0.9;">رقم الطلب: #${order.id}</p>
            </div>
            <div class="content">
                <div class="section">
                    <h3>👤 معلومات العميل</h3>
                    <div class="info-row">
                        <span class="info-label">الاسم الكامل:</span>
                        <span class="info-value">${order.customer.firstName} ${order.customer.lastName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">رقم الهاتف:</span>
                        <span class="info-value"><a href="tel:${order.customer.phone}" style="color: #e94560; text-decoration: none;">${order.customer.phone}</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">البريد الإلكتروني:</span>
                        <span class="info-value"><a href="mailto:${order.customer.email}" style="color: #e94560; text-decoration: none;">${order.customer.email}</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">الولاية:</span>
                        <span class="info-value"><span class="wilaya-badge">${order.customer.wilaya || 'غير محدد'}</span></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">العنوان:</span>
                        <span class="info-value">${order.customer.address || 'غير محدد'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>📦 المنتجات المطلوبة</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>السعر</th>
                                <th>المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsList}
                        </tbody>
                    </table>
                    <div class="total">
                        💰 المجموع الكلي: ${formatPriceDZD(order.totalPrice)}
                    </div>
                </div>
                
                <div class="section">
                    <h3>📅 تفاصيل الطلب</h3>
                    <div class="info-row">
                        <span class="info-label">رقم الطلب:</span>
                        <span class="info-value">#${order.id}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">تاريخ الطلب:</span>
                        <span class="info-value">${new Date(order.date).toLocaleString('ar-DZ')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">طريقة الدفع:</span>
                        <span class="info-value">💵 الدفع عند الاستلام</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <a href="tel:${order.customer.phone}" class="btn">📞 اتصل بالعميل</a>
                    <a href="mailto:${order.customer.email}" class="btn">📧 راسل العميل</a>
                </div>
            </div>
            <div class="footer">
                <p>تم إرسال هذا البريد تلقائياً من متجري 🇩🇿</p>
                <p>لعرض جميع الطلبات: <a href="http://localhost:3000/admin" style="color: #e94560;">لوحة التحكم</a></p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: EMAIL_CONFIG.senderEmail,
        to: EMAIL_CONFIG.receiverEmail,
        subject: `🛒 طلب جديد #${order.id} - ${order.customer.firstName} ${order.customer.lastName} - ${formatPriceDZD(order.totalPrice)} - ${order.customer.wilaya || ''}`,
        html: emailHTML
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email notification sent successfully!');
        return true;
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        console.log('💡 Make sure you have set up your App Password in EMAIL_CONFIG');
        return false;
    }
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basic Auth middleware for admin
function adminAuth(req, res, next) {
    const auth = req.headers.authorization;
    
    if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('تسجيل الدخول مطلوب');
    }
    
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
    const [username, password] = credentials.split(':');
    
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

// Protect admin page
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/admin.html', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Logout endpoint - forces browser to clear credentials
app.get('/logout', (req, res) => {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تم تسجيل الخروج</title>
            <style>
                body { font-family: 'Cairo', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a2e; color: white; }
                .box { text-align: center; padding: 40px; background: #16213e; border-radius: 20px; }
                a { color: #e94560; text-decoration: none; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>✅ تم تسجيل الخروج</h1>
                <p>تم تسجيل خروجك بنجاح</p>
                <p><a href="/">العودة للمتجر</a> | <a href="/admin">تسجيل الدخول مرة أخرى</a></p>
            </div>
        </body>
        </html>
    `);
});

// Protect admin API routes
app.use('/api/orders', (req, res, next) => {
    // Allow POST (creating orders) without auth
    if (req.method === 'POST') {
        return next();
    }
    // All other methods (GET, PUT, DELETE) require auth
    adminAuth(req, res, next);
});

app.use(express.static('public'));
app.use('/images', express.static('images'));
app.use('/order-images', express.static('order-images'));

// Ensure required directories exist
const dirs = ['orders', 'order-images', 'images', 'public'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Initialize orders file
const ordersFile = 'orders/orders.json';
if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
}

// Products data - Spices Packs - Prices in Algerian Dinar (DZD)
let products = [
    {
        id: 1,
        name: "Basic Spices Pack",
        nameAr: "باك التوابل الأساسية",
        price: 1900,
        oldPrice: 2900,
        description: "Essential spices for everyday cooking",
        descriptionAr: "توابل أساسية للطبخ اليومي - فلفل أسود، كمون، كركم، بابريكا، زنجبيل",
        image: "spices-basic.svg",
        badge: "الأكثر مبيعاً"
    },
    {
        id: 2,
        name: "Special Spices Pack",
        nameAr: "باك التوابل الخاصة",
        price: 2900,
        oldPrice: 3500,
        description: "Premium spices for special dishes",
        descriptionAr: "توابل خاصة للأطباق المميزة - زعفران، هيل، قرفة، جوزة الطيب، قرنفل",
        image: "spices-special.svg",
        badge: "مميز"
    },
    {
        id: 3,
        name: "Extra Spices Pack",
        nameAr: "باك التوابل الإضافية",
        price: 2500,
        oldPrice: 2900,
        description: "Additional spices to complete your kitchen",
        descriptionAr: "توابل إضافية لمطبخك - سماق، زعتر، حب الهال، ورق الغار، كزبرة",
        image: "spices-extra.svg",
        badge: "جديد"
    },
    {
        id: 4,
        name: "Complete Spices Pack",
        nameAr: "باك التوابل الكاملة",
        price: 6900,
        oldPrice: 9300,
        description: "All spices in one complete pack - Best value!",
        descriptionAr: "جميع التوابل في باك واحد - أفضل قيمة! يشمل جميع الباكات الثلاثة",
        image: "spices-complete.svg",
        badge: "عرض خاص"
    },
    {
        id: 5,
        name: "Ras El Hanout",
        nameAr: "رأس الحانوت",
        price: 1200,
        oldPrice: 1500,
        description: "Traditional Maghrebi spice blend",
        descriptionAr: "خلطة توابل مغاربية تقليدية - مزيج من أكثر من 20 نوع توابل",
        image: "ras-el-hanout.svg",
        badge: "تقليدي"
    },
    {
        id: 6,
        name: "Harissa Powder",
        nameAr: "هريسة مجففة",
        price: 800,
        oldPrice: 1000,
        description: "Hot chili pepper blend",
        descriptionAr: "مسحوق الهريسة الحارة - فلفل أحمر، ثوم، كمون، كزبرة",
        image: "harissa.svg",
        badge: "حار 🌶️"
    },
    {
        id: 7,
        name: "Saffron Premium",
        nameAr: "زعفران فاخر",
        price: 3500,
        oldPrice: 4500,
        description: "Premium quality saffron threads",
        descriptionAr: "زعفران أصلي فاخر - خيوط زعفران نقية 100%",
        image: "saffron.svg",
        badge: "فاخر"
    },
    {
        id: 8,
        name: "Mixed Herbs",
        nameAr: "خلطة الأعشاب",
        price: 700,
        oldPrice: 900,
        description: "Dried herb mix for cooking",
        descriptionAr: "خلطة أعشاب مجففة - نعناع، بقدونس، كزبرة، شبت، ريحان",
        image: "herbs.svg",
        badge: ""
    }
];

// API: Get all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// API: Add new product (Admin)
app.post('/api/products/add', adminAuth, (req, res) => {
    const { nameAr, price, oldPrice, descriptionAr, badge } = req.body;
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
        id: newId,
        name: nameAr,
        nameAr,
        price: parseInt(price),
        oldPrice: oldPrice ? parseInt(oldPrice) : null,
        description: descriptionAr,
        descriptionAr,
        image: "spices-default.svg",
        badge: badge || ""
    };
    products.push(newProduct);
    res.json({ success: true, product: newProduct });
});

// API: Delete product (Admin)
app.delete('/api/products/:id', adminAuth, (req, res) => {
    const productId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        products.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// API: Get single product
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// API: Create order
app.post('/api/orders', (req, res) => {
    try {
        const { customer, items, totalPrice, productImage } = req.body;
        
        // Validate required fields
        if (!customer || !customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
            return res.status(400).json({ error: 'All customer fields are required' });
        }
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required' });
        }
        
        // Read existing orders
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        }
        
        // Create new order
        const orderId = Date.now();
        const newOrder = {
            id: orderId,
            date: new Date().toISOString(),
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
            status: 'new'
        };
        
        // Save product image if provided
        if (productImage) {
            const imageFileName = `order-${orderId}.png`;
            const base64Data = productImage.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFileSync(`order-images/${imageFileName}`, base64Data, 'base64');
            newOrder.image = imageFileName;
        }
        
        // Add order to array
        orders.push(newOrder);
        
        // Save orders
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
        
        // Show notification in console (visible in the terminal)
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
        
        // Play notification sound (Windows)
        try {
            const { exec } = require('child_process');
            exec('powershell -c "[console]::beep(800,300)"');
        } catch (e) {
            // Sound notification failed, ignore
        }
        
        // Send email notification
        sendOrderEmail(newOrder);
        
        res.json({ success: true, orderId: orderId, message: 'تم إرسال الطلب بنجاح!' });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'فشل في إرسال الطلب' });
    }
});

// API: Get all orders (for admin)
app.get('/api/orders', (req, res) => {
    try {
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        }
        // Return orders in reverse order (newest first)
        res.json(orders.reverse());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// API: Update order status
app.put('/api/orders/:id/status', (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;
        
        let orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        orders[orderIndex].status = status;
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// API: Delete order
app.delete('/api/orders/:id', (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        
        let orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Delete associated image if exists
        if (orders[orderIndex].image) {
            const imagePath = `order-images/${orders[orderIndex].image}`;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        orders.splice(orderIndex, 1);
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
        
        res.json({ success: true });
    } catch (error) {
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

// Start server
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🛒 MY SHOP SERVER STARTED');
    console.log('========================================');
    console.log(`Shop URL: http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin`);
    console.log('========================================');
    console.log('Waiting for orders...');
    console.log('');
});
