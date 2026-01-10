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

// Admin page - no auth required
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/admin.html', (req, res) => {
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

// Admin API routes - no auth required
app.use('/api/orders', (req, res, next) => {
    next();
});

app.use(express.static('public'));
app.use('/images', express.static('images'));
app.use('/order-images', express.static('order-images'));
app.use('/product-images', express.static('product-images'));

// Ensure required directories exist
const dirs = ['orders', 'order-images', 'images', 'public', 'product-images'];
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

// Products data - Bio Natural Products - Prices in Algerian Dinar (DZD)
let products = [
    {
        id: 1,
        name: "Natural Honey",
        nameAr: "عسل طبيعي",
        price: 2500,
        oldPrice: 3000,
        description: "Pure natural honey",
        descriptionAr: "عسل طبيعي نقي 100% - من جبال الجزائر",
        image: "honey.svg",
        badge: "الأكثر مبيعاً"
    },
    {
        id: 2,
        name: "Argan Oil",
        nameAr: "زيت الأركان",
        price: 3500,
        oldPrice: 4500,
        description: "Pure argan oil for skin and hair",
        descriptionAr: "زيت أركان نقي للبشرة والشعر - 100% طبيعي",
        image: "argan.svg",
        badge: "مميز"
    },
    {
        id: 3,
        name: "Black Seed Oil",
        nameAr: "زيت الحبة السوداء",
        price: 2000,
        oldPrice: 2500,
        description: "Cold pressed black seed oil",
        descriptionAr: "زيت حبة البركة المعصور على البارد - لتقوية المناعة",
        image: "blackseed.svg",
        badge: "جديد"
    },
    {
        id: 4,
        name: "Bio Pack Complete",
        nameAr: "باك بيو الكامل",
        price: 7500,
        oldPrice: 10000,
        description: "Complete natural products pack",
        descriptionAr: "باك كامل من المنتجات الطبيعية - عسل + زيت أركان + زيت حبة البركة",
        image: "biopack.svg",
        badge: "عرض خاص"
    },
    {
        id: 5,
        name: "Rose Water",
        nameAr: "ماء الورد",
        price: 800,
        oldPrice: 1000,
        description: "Natural rose water for skin",
        descriptionAr: "ماء ورد طبيعي للعناية بالبشرة",
        image: "rosewater.svg",
        badge: "للبشرة"
    },
    {
        id: 6,
        name: "Olive Oil",
        nameAr: "زيت الزيتون البكر",
        price: 1800,
        oldPrice: 2200,
        description: "Extra virgin olive oil",
        descriptionAr: "زيت زيتون بكر ممتاز - من زيتون الجزائر",
        image: "oliveoil.svg",
        badge: "عضوي"
    },
    {
        id: 7,
        name: "Coconut Oil",
        nameAr: "زيت جوز الهند",
        price: 1500,
        oldPrice: 1900,
        description: "Pure coconut oil",
        descriptionAr: "زيت جوز الهند النقي - للشعر والبشرة",
        image: "coconut.svg",
        badge: "طبيعي"
    },
    {
        id: 8,
        name: "Herbal Tea Mix",
        nameAr: "خلطة أعشاب طبيعية",
        price: 600,
        oldPrice: 800,
        description: "Natural herbal tea blend",
        descriptionAr: "خلطة أعشاب طبيعية - بابونج، نعناع، يانسون، شمر",
        image: "herbs.svg",
        badge: ""
    }
];

// API: Get all products
app.get('/api/products', (req, res) => {
    // Map products to return Arabic names as main name
    const mappedProducts = products.map(p => ({
        id: p.id,
        name: p.nameAr || p.name,
        price: p.price,
        oldPrice: p.oldPrice,
        description: p.descriptionAr || p.description,
        image: p.image && (p.image.startsWith('http') || p.image.startsWith('/') || p.image.includes('.png') || p.image.includes('.jpg')) 
            ? (p.image.includes('/') ? p.image : `/product-images/${p.image}`)
            : `https://via.placeholder.com/300x300/2e8b57/ffffff?text=${encodeURIComponent(p.nameAr || p.name)}`,
        badge: p.badge
    }));
    res.json(mappedProducts);
});

// API: Add new product (Admin)
app.post('/api/products/add', (req, res) => {
    const { nameAr, price, oldPrice, descriptionAr, badge, image } = req.body;
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    let imageName = 'spices-default.svg';
    
    // Save product image if provided
    if (image && image.startsWith('data:image')) {
        const imageFileName = `product-${newId}-${Date.now()}.png`;
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        if (!fs.existsSync('product-images')) {
            fs.mkdirSync('product-images', { recursive: true });
        }
        fs.writeFileSync(`product-images/${imageFileName}`, base64Data, 'base64');
        imageName = imageFileName;
    }
    
    const newProduct = {
        id: newId,
        name: nameAr,
        nameAr,
        price: parseInt(price),
        oldPrice: oldPrice ? parseInt(oldPrice) : null,
        description: descriptionAr,
        descriptionAr,
        image: imageName,
        badge: badge || ""
    };
    products.push(newProduct);
    res.json({ success: true, product: newProduct });
});

// API: Delete product (Admin)
app.delete('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        products.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// API: Update product (Admin)
app.put('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const { nameAr, price, oldPrice, descriptionAr, badge, image } = req.body;
    
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    let imageName = products[index].image;
    
    // Save new product image if provided
    if (image && image.startsWith('data:image')) {
        const imageFileName = `product-${productId}-${Date.now()}.png`;
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        if (!fs.existsSync('product-images')) {
            fs.mkdirSync('product-images', { recursive: true });
        }
        fs.writeFileSync(`product-images/${imageFileName}`, base64Data, 'base64');
        imageName = imageFileName;
    }
    
    products[index] = {
        ...products[index],
        name: nameAr,
        nameAr,
        price: parseInt(price),
        oldPrice: oldPrice ? parseInt(oldPrice) : null,
        description: descriptionAr,
        descriptionAr,
        image: imageName,
        badge: badge || ""
    };
    
    res.json({ success: true, product: products[index] });
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
