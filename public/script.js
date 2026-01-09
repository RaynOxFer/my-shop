// Shopping Cart State
let cart = [];
let products = [];
let currentProduct = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCartFromStorage();
    updateCartUI();
});

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('خطأ في تحميل المنتجات', 'error');
    }
}

// Format price in DZD
function formatPrice(price) {
    return price.toLocaleString('ar-DZ') + ' د.ج';
}

// Render products grid
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = products.map(product => `
        <div class="product-card" data-name="${product.name}" data-name-ar="${product.nameAr || ''}">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <div class="product-image" onclick="openProductModal(${product.id})">
                <img src="/images/${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image product-placeholder\\'></i>'">
                <div class="product-overlay">
                    <button onclick="event.stopPropagation(); openProductModal(${product.id})">
                        <i class="fas fa-eye"></i> عرض سريع
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.nameAr || product.name}</h3>
                <p class="product-description">${product.descriptionAr || product.description}</p>
                <p class="product-price">${formatPrice(product.price)}</p>
                <button class="btn-add" onclick="addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> أضف إلى السلة
                </button>
            </div>
        </div>
    `).join('');
}

// Search products
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const nameAr = card.dataset.nameAr.toLowerCase();
        if (name.includes(searchTerm) || nameAr.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('active');
}

// Add product to cart
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            nameAr: product.nameAr || product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }

    saveCartToStorage();
    updateCartUI();
    showToast(`تمت إضافة ${product.nameAr || product.name} إلى السلة!`, 'success');
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
}

// Update item quantity
function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCartToStorage();
        updateCartUI();
    }
}

// Calculate total price
function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <p>سلة التسوق فارغة</p>
            </div>
        `;
        checkoutBtn.disabled = true;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="/images/${item.image}" alt="${item.nameAr}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\'></i>'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.nameAr}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
    }

    // Update total
    cartTotal.textContent = formatPrice(calculateTotal());
}

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

// Open checkout modal
function openCheckout() {
    if (cart.length === 0) return;

    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');

    // Populate checkout items
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.nameAr} × ${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    checkoutTotal.textContent = formatPrice(calculateTotal());

    // Close cart and open checkout
    toggleCart();
    checkoutModal.classList.add('active');
}

// Close checkout modal
function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

// Submit order
async function submitOrder(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> جاري المعالجة...';

    const formData = {
        customer: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            wilaya: document.getElementById('wilaya').value,
            address: document.getElementById('address').value
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            nameAr: item.nameAr,
            price: item.price,
            quantity: item.quantity,
            image: item.image
        })),
        totalPrice: calculateTotal()
    };

    // Try to capture product image for the order
    try {
        const firstProduct = products.find(p => p.id === cart[0].id);
        if (firstProduct) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = `/images/${firstProduct.image}`;
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
            });

            if (img.complete && img.naturalWidth > 0) {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                formData.productImage = canvas.toDataURL('image/png');
            }
        }
    } catch (e) {
        console.log('Could not capture product image:', e);
    }

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Close checkout and show success
            closeCheckout();
            showSuccessModal(result.orderId);
            
            // Clear cart
            cart = [];
            saveCartToStorage();
            updateCartUI();
            
            // Reset form
            document.getElementById('checkoutForm').reset();
        } else {
            showToast(result.error || 'فشل في إرسال الطلب', 'error');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showToast('خطأ في إرسال الطلب. حاول مرة أخرى.', 'error');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> تأكيد الطلب';
}

// Show success modal
function showSuccessModal(orderId) {
    document.getElementById('orderId').textContent = orderId;
    document.getElementById('successModal').classList.add('active');
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
}

// Product Modal Functions
function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    document.getElementById('modalProductName').textContent = currentProduct.nameAr || currentProduct.name;
    document.getElementById('modalProductPrice').textContent = formatPrice(currentProduct.price);
    document.getElementById('modalProductDescription').textContent = currentProduct.descriptionAr || currentProduct.description;
    document.getElementById('modalQuantity').value = 1;

    const imageContainer = document.getElementById('modalProductImage');
    imageContainer.innerHTML = `<img src="/images/${currentProduct.image}" alt="${currentProduct.nameAr || currentProduct.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\' style=\\'font-size:60px;color:#ccc;\\'></i>'">`;

    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    currentProduct = null;
}

function increaseModalQuantity() {
    const input = document.getElementById('modalQuantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseModalQuantity() {
    const input = document.getElementById('modalQuantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

function addToCartFromModal() {
    if (!currentProduct) return;
    const quantity = parseInt(document.getElementById('modalQuantity').value) || 1;
    addToCart(currentProduct.id, quantity);
    closeProductModal();
}

// Local Storage Functions
function saveCartToStorage() {
    localStorage.setItem('shopCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('shopCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Close modals on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCheckout();
        closeSuccessModal();
        closeProductModal();
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar.classList.contains('active')) {
            toggleCart();
        }
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    }
});

// Close modals when clicking outside
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
