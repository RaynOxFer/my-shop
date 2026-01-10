// Shopping Cart State
let cart = [];
let products = [];
let currentProduct = null;

// Theme Toggle Function
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update toggle icon
    const icon = document.querySelector('.theme-toggle-ball i');
    if (icon) {
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Load saved theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const icon = document.querySelector('.theme-toggle-ball i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
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

// Render products to the grid
function renderProducts(filteredProducts = null) {
    const productsToRender = filteredProducts || products;
    const grid = document.getElementById('productsGrid');
    
    if (!grid) return;
    
    grid.innerHTML = productsToRender.map(product => `
        <div class="product-card" data-id="${product.id}">
            ${product.badge ? `<div class="product-badge">${product.badge}</div>` : '<div class="product-badge">جديد</div>'}
            <div class="product-image" onclick="openProductModal(${product.id})">
                <img src="${product.image || 'https://via.placeholder.com/300x300/2e8b57/ffffff?text=منتج'}" alt="${product.name}" loading="lazy">
                <div class="product-overlay">
                    <button class="quick-view-btn">
                        <i class="fas fa-eye"></i> معاينة سريعة
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || 'منتج طبيعي 100%'}</p>
                <div class="product-footer">
                    <div class="product-prices">
                        <span class="product-price">${product.price.toLocaleString()} د.ج</span>
                        ${product.oldPrice ? `<span class="old-price">${product.oldPrice.toLocaleString()} د.ج</span>` : ''}
                    </div>
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Search Products
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderProducts();
        return;
    }
    
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
    );
    
    renderProducts(filtered);
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    showToast('تمت الإضافة إلى السلة', 'success');
    
    // Animation effect
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.classList.add('bounce');
    setTimeout(() => cartIcon.classList.remove('bounce'), 300);
}

// Update Cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>السلة فارغة</p>
            </div>
        `;
        checkoutBtn.disabled = true;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image || 'https://via.placeholder.com/60x60?text=منتج'}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price.toLocaleString()} د.ج</p>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `${total.toLocaleString()} د.ج`;
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

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
    showToast('تم الحذف من السلة', 'success');
}

// Toggle Cart Sidebar
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

// Open Checkout Modal
function openCheckout() {
    toggleCart();
    
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    // Populate order summary
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>${(item.price * item.quantity).toLocaleString()} د.ج</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = `${total.toLocaleString()} د.ج`;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Checkout
function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Submit Order
async function submitOrder(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    
    const formData = {
        customer: {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            wilaya: document.getElementById('wilaya').value,
            address: document.getElementById('address').value
        },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Show success modal
            closeCheckout();
            document.getElementById('orderId').textContent = result.orderId;
            document.getElementById('successModal').classList.add('active');
            
            // Clear cart
            cart = [];
            saveCartToStorage();
            updateCartUI();
            
            // Reset form
            document.getElementById('checkoutForm').reset();
        } else {
            showToast(result.message || 'خطأ في إرسال الطلب', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> تأكيد الطلب';
    }
}

// Close Success Modal
function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Product Modal Functions
function openProductModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;
    
    document.getElementById('modalProductImage').src = currentProduct.image || 'https://via.placeholder.com/400x400?text=منتج';
    document.getElementById('modalProductName').textContent = currentProduct.name;
    document.getElementById('modalProductPrice').textContent = `${currentProduct.price.toLocaleString()} د.ج`;
    document.getElementById('modalProductDescription').textContent = currentProduct.description || 'منتج طبيعي 100% من راحة بيو';
    document.getElementById('modalQuantity').value = 1;
    
    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
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
    
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    const existingItem = cart.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image,
            quantity: quantity
        });
    }
    
    saveCartToStorage();
    updateCartUI();
    closeProductModal();
    showToast('تمت الإضافة إلى السلة', 'success');
}

// Mobile Menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// Local Storage Functions
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    // Create toast if not exists
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.innerHTML = '<i class="fas fa-check-circle"></i><span></span>';
        document.body.appendChild(toast);
    }
    
    const icon = toast.querySelector('i');
    const text = toast.querySelector('span');
    
    text.textContent = message;
    toast.className = `toast ${type}`;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar && cartSidebar.classList.contains('open')) {
            toggleCart();
        }
        document.body.style.overflow = '';
    }
});

// Track Order Function
async function trackOrder() {
    const orderId = document.getElementById('trackOrderId').value.trim();
    const resultDiv = document.getElementById('trackResult');
    
    if (!orderId) {
        resultDiv.innerHTML = '<p>الرجاء إدخال رقم الطلب</p>';
        resultDiv.className = 'track-result error';
        resultDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`/api/orders/track/${orderId}`);
        const data = await response.json();
        
        if (response.ok && data.found) {
            const statusTexts = {
                'pending': 'في الانتظار',
                'new': 'جديد',
                'accepted': 'تم القبول',
                'shipped': 'في الطريق',
                'delivered': 'تم التسليم',
                'rejected': 'مرفوض',
                'cancelled': 'ملغي'
            };
            
            const statusIcons = {
                'pending': 'fa-clock',
                'new': 'fa-clock',
                'accepted': 'fa-check-circle',
                'shipped': 'fa-truck',
                'delivered': 'fa-box',
                'rejected': 'fa-times-circle',
                'cancelled': 'fa-times-circle'
            };
            
            // Determine timeline steps status
            const steps = ['pending', 'accepted', 'shipped', 'delivered'];
            const currentIndex = steps.indexOf(data.status);
            
            let timelineHTML = '';
            if (data.status !== 'rejected' && data.status !== 'cancelled') {
                timelineHTML = `
                    <div class="track-timeline">
                        <div class="timeline-step ${currentIndex >= 0 ? 'completed' : ''}">
                            <div class="timeline-icon"><i class="fas fa-clock"></i></div>
                            <span class="timeline-label">في الانتظار</span>
                        </div>
                        <div class="timeline-step ${currentIndex >= 1 ? 'completed' : ''} ${currentIndex === 1 ? 'active' : ''}">
                            <div class="timeline-icon"><i class="fas fa-check"></i></div>
                            <span class="timeline-label">تم القبول</span>
                        </div>
                        <div class="timeline-step ${currentIndex >= 2 ? 'completed' : ''} ${currentIndex === 2 ? 'active' : ''}">
                            <div class="timeline-icon"><i class="fas fa-truck"></i></div>
                            <span class="timeline-label">في الطريق</span>
                        </div>
                        <div class="timeline-step ${currentIndex >= 3 ? 'completed' : ''} ${currentIndex === 3 ? 'active' : ''}">
                            <div class="timeline-icon"><i class="fas fa-box"></i></div>
                            <span class="timeline-label">تم التسليم</span>
                        </div>
                    </div>
                `;
            }
            
            resultDiv.innerHTML = `
                <div class="track-order-info">
                    <h4><i class="fas fa-receipt"></i> معلومات الطلب #${data.orderId}</h4>
                    <div class="track-order-details">
                        <div class="track-detail">
                            <span class="track-detail-label">تاريخ الطلب</span>
                            <span class="track-detail-value">${new Date(data.date).toLocaleDateString('ar-DZ')}</span>
                        </div>
                        <div class="track-detail">
                            <span class="track-detail-label">اسم العميل</span>
                            <span class="track-detail-value">${data.customerName}</span>
                        </div>
                        <div class="track-detail">
                            <span class="track-detail-label">المبلغ الإجمالي</span>
                            <span class="track-detail-value">${data.totalPrice.toLocaleString()} د.ج</span>
                        </div>
                    </div>
                    <div class="track-status ${data.status}">
                        <i class="fas ${statusIcons[data.status] || 'fa-info-circle'}"></i>
                        ${statusTexts[data.status] || data.status}
                    </div>
                    ${timelineHTML}
                </div>
            `;
            resultDiv.className = 'track-result success';
        } else {
            resultDiv.innerHTML = `
                <p><i class="fas fa-exclamation-triangle"></i> لم يتم العثور على طلب بهذا الرقم</p>
                <p style="font-size: 13px; margin-top: 10px;">تأكد من رقم الطلب وحاول مرة أخرى</p>
            `;
            resultDiv.className = 'track-result error';
        }
        
        resultDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Error tracking order:', error);
        resultDiv.innerHTML = '<p><i class="fas fa-exclamation-triangle"></i> حدث خطأ أثناء البحث</p>';
        resultDiv.className = 'track-result error';
        resultDiv.style.display = 'block';
    }
}

// Allow Enter key to track order
document.addEventListener('DOMContentLoaded', () => {
    const trackInput = document.getElementById('trackOrderId');
    if (trackInput) {
        trackInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                trackOrder();
            }
        });
    }
});
