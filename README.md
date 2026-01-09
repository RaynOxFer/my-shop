# MyShop - E-commerce Website

A complete e-commerce website with local order management system.

## Features

- 🛒 **Product Catalog** - Display products with images, descriptions, and prices
- 🛍️ **Shopping Cart** - Add/remove items, update quantities
- 📝 **Checkout Form** - Collect customer information (name, email, phone)
- ✅ **Order Confirmation** - Success message with order ID
- 📋 **Admin Panel** - View and manage all orders
- 🔔 **Order Notifications** - Sound alert + console notification for new orders
- 💾 **Local Database** - Orders saved to JSON file on your PC

## Installation

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Choose the LTS version

2. **Install Dependencies**
   Open a terminal in the shop folder and run:
   ```
   npm install
   ```

3. **Start the Server**
   ```
   npm start
   ```

4. **Open the Website**
   - Shop: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

## How It Works

### For Customers:
1. Browse products on the main page
2. Click "Add to Cart" to add items
3. Click the cart icon to view cart
4. Click "Proceed to Checkout"
5. Fill in personal information (name, email, phone)
6. Click "Place Order"
7. See success message with order ID

### For You (Shop Owner):
1. Keep the server running
2. Open the Admin Panel: http://localhost:3000/admin
3. You'll see all orders with:
   - Customer name, email, phone
   - Products ordered
   - Total price
   - Order date
4. Click on an order to expand details
5. Mark orders as "Contacted" or "Completed"
6. Click email/phone to contact customer directly

### Order Notifications:
- When a customer places an order, you'll hear a sound
- The order details appear in the terminal console
- The Admin Panel auto-refreshes every 10 seconds

## File Structure

```
shop/
├── server.js          # Main server file
├── package.json       # Project configuration
├── public/
│   ├── index.html     # Shop main page
│   ├── admin.html     # Admin panel
│   ├── styles.css     # Website styles
│   └── script.js      # Shop functionality
├── images/            # Product images
├── orders/
│   └── orders.json    # Order database
└── order-images/      # Product images from orders
```

## Customizing Products

Edit the `products` array in `server.js` to add/modify products:

```javascript
const products = [
    {
        id: 1,
        name: "Your Product Name",
        price: 99.99,
        description: "Product description",
        image: "your-image.jpg"  // Place image in /images folder
    },
    // Add more products...
];
```

## Adding Product Images

1. Place your product images in the `images/` folder
2. Update the `image` field in the products array
3. Restart the server

## Troubleshooting

**Server won't start:**
- Make sure Node.js is installed
- Run `npm install` to install dependencies

**Can't see images:**
- Check that images are in the `images/` folder
- Make sure image filenames match the ones in server.js

**Orders not saving:**
- Check that the `orders/` folder exists
- Make sure the server has write permissions

## Support

If you need help, check the terminal for error messages.
