// DRINK DATABASE
const DRINKS = [
    { id: 'oishi', nameTH: 'โออิชิ', nameEN: 'Oishi', category: 'tea', color: '#8FA87B', colorRgb: '143, 168, 123', icon: 'fa-leaf' },
    { id: 'grape', nameTH: 'องุ่นเคียวโฮ', nameEN: 'Kyoho Grape', category: 'fruit', color: '#A28AA8', colorRgb: '162, 138, 168', icon: 'fa-wine-glass' },
    { id: 'bitter', nameTH: 'เดิมขม', nameEN: 'Original Bitter', category: 'dark', color: '#7E8578', colorRgb: '126, 133, 120', icon: 'fa-mug-hot' },
    { id: 'sweet', nameTH: 'เดิมหวาน', nameEN: 'Original Sweet', category: 'amber', color: '#DDB87B', colorRgb: '221, 184, 123', icon: 'fa-cookie' },
    { id: 'honey-lemon', nameTH: 'น้ำผึ้งมะนาว', nameEN: 'Honey Lemon', category: 'yellow', color: '#E0C068', colorRgb: '224, 192, 104', icon: 'fa-lemon' },
    { id: 'blueberry', nameTH: 'บลูเบอร์รี่', nameEN: 'Blueberry', category: 'fruit', color: '#7B94B8', colorRgb: '123, 148, 184', icon: 'fa-seedling' },
    { id: 'yogurt', nameTH: 'โยเกิร์ต', nameEN: 'Yogurt', category: 'yogurt', color: '#D2A0A8', colorRgb: '210, 160, 168', icon: 'fa-cheese' },
    { id: 'strawberry-yogurt', nameTH: 'โยเกิร์ตสตอเบอรี่', nameEN: 'Strawberry Yogurt', category: 'yogurt', color: '#D48A92', colorRgb: '212, 138, 146', icon: 'fa-ice-cream' },
    { id: 'strawberry', nameTH: 'สตอเบอรี่', nameEN: 'Strawberry', category: 'fruit', color: '#D96B6B', colorRgb: '217, 107, 107', icon: 'fa-apple-whole' },
    { id: 'apple', nameTH: 'แอปเปิ้ล', nameEN: 'Apple', category: 'fruit', color: '#CE7B7B', colorRgb: '206, 123, 123', icon: 'fa-apple-whole' },
    { id: 'greentea', nameTH: 'ชาเขียว', nameEN: 'Green Tea', category: 'tea', color: '#7CA682', colorRgb: '124, 166, 130', icon: 'fa-mug-hot' },
    { id: 'taro', nameTH: 'เผือก', nameEN: 'Taro', category: 'yogurt', color: '#B0A2C7', colorRgb: '176, 162, 199', icon: 'fa-egg' },
    { id: 'cocoa', nameTH: 'โกโก้', nameEN: 'Cocoa', category: 'cocoa', color: '#9C7C60', colorRgb: '156, 124, 96', icon: 'fa-mug-hot' },
    { id: 'watermelon', nameTH: 'แตงโม', nameEN: 'Watermelon', category: 'fruit', color: '#DF8A8E', colorRgb: '223, 138, 142', icon: 'fa-lemon' }
];

const PRICE_PER_BOTTLE = 80;

// STATE MANAGEMENT
let state = {
    orders: [],
    grabPickups: [],
    editingOrderId: null,
    cart: {}, // drinkId -> quantity
    searchQuery: '',
    tab: 'orders-tab',
    sheetUrl: '',
    autoSync: false,
    stock: {} // drinkId -> quantity
};

// LOAD INITIAL STATE FROM LOCAL STORAGE
function init() {
    const savedState = localStorage.getItem('juice_bar_tracker_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            state.orders = parsed.orders || [];
            state.grabPickups = parsed.grabPickups || [];
            state.stock = parsed.stock || {};
        } catch (e) {
            console.error("Error parsing saved state", e);
        }
    }
    
    // Ensure all drinks in database have a stock quantity (default to 20 if not set)
    DRINKS.forEach(drink => {
        if (state.stock[drink.id] === undefined) {
            state.stock[drink.id] = 20;
        }
    });
    
    // Load Google Sheets configurations
    state.sheetUrl = localStorage.getItem('juice_bar_sheet_url') || '';
    state.autoSync = localStorage.getItem('juice_bar_auto_sync') === 'true';
    
    // Populate Google Sheets UI inputs
    document.getElementById('sheet-url-input').value = state.sheetUrl;
    document.getElementById('auto-sync-checkbox').checked = state.autoSync;
    
    // Set default dates
    const todayStr = getLocalDateString(new Date());
    document.getElementById('order-date').value = todayStr;
    document.getElementById('filter-custom-date').value = todayStr;
    
    // Bind UI elements & Listeners
    setupClock();
    setupEventListeners();
    renderDrinkGrid();
    renderCart();
    renderOrders();
    renderGrabLogs();
    renderStock();
    renderAnalytics();
    
    // Auto-pull from sheet on startup if URL is configured
    if (state.sheetUrl) {
        pullFromSheets(true);
    }
}

// SAVE STATE TO LOCAL STORAGE
function saveToLocalStorage(skipSync = false) {
    localStorage.setItem('juice_bar_tracker_state', JSON.stringify({
        orders: state.orders,
        grabPickups: state.grabPickups,
        stock: state.stock
    }));
    
    if (!skipSync && state.autoSync && state.sheetUrl) {
        pushToSheets(true);
    }
}

// GET DATE STRING IN YYYY-MM-DD
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// CLOCK MODULE
function setupClock() {
    const clockEl = document.getElementById('current-time');
    
    function updateClock() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false
        };
        const thaiDate = now.toLocaleDateString('th-TH', options);
        clockEl.textContent = thaiDate;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// PRICING ALGORITHM - CHEAPEST PROMOTION COMBINATION
function calculateBestPrice(quantity) {
    if (quantity <= 0) {
        return { total: 0, num7: 0, num4: 0, num1: 0, discount: 0 };
    }
    
    let minCost = Infinity;
    let bestCombination = { num7: 0, num4: 0, num1: 0 };
    
    const max7 = Math.floor(quantity / 7);
    for (let s = 0; s <= max7; s++) {
        const remainingAfter7 = quantity - s * 7;
        const max4 = Math.floor(remainingAfter7 / 4);
        for (let f = 0; f <= max4; f++) {
            const remainingAfter4 = remainingAfter7 - f * 4;
            const cost = s * 500 + f * 300 + remainingAfter4 * PRICE_PER_BOTTLE;
            if (cost < minCost) {
                minCost = cost;
                bestCombination = { num7: s, num4: f, num1: remainingAfter4 };
            }
        }
    }
    
    const normalPrice = quantity * PRICE_PER_BOTTLE;
    const discount = normalPrice - minCost;
    
    return {
        total: minCost,
        num7: bestCombination.num7,
        num4: bestCombination.num4,
        num1: bestCombination.num1,
        discount: discount
    };
}

// EVENT LISTENERS BINDING
function setupEventListeners() {
    // Delivery channel switch
    const deliveryTypeSelect = document.getElementById('delivery-type');
    const grabDriverGroup = document.getElementById('grab-driver-group');
    deliveryTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'grab') {
            grabDriverGroup.style.display = 'block';
        } else {
            grabDriverGroup.style.display = 'none';
        }
    });

    // Drink search input
    const drinkSearch = document.getElementById('drink-search');
    const clearSearchBtn = document.getElementById('btn-clear-search');
    
    drinkSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderDrinkGrid();
        if (state.searchQuery) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        drinkSearch.value = '';
        state.searchQuery = '';
        renderDrinkGrid();
        clearSearchBtn.style.display = 'none';
    });

    // Customer Name / Table dropdown change handler
    const customerInput = document.getElementById('customer-name');
    customerInput.addEventListener('change', (e) => {
        const val = e.target.value;
        const deliveryTypeSelect = document.getElementById('delivery-type');
        const grabDriverGroup = document.getElementById('grab-driver-group');
        
        if (val === 'Grab') {
            deliveryTypeSelect.value = 'grab';
            grabDriverGroup.style.display = 'block';
        } else {
            deliveryTypeSelect.value = 'walkin';
            grabDriverGroup.style.display = 'none';
        }
        
        // Suggest incremental order merge if table has an active order today
        if (val && val !== 'กลับบ้าน' && val !== 'Grab') {
            checkCustomerPreviousOrders(val);
        }
    });

    // Clear POS Form button
    document.getElementById('btn-clear-form').addEventListener('click', () => {
        clearPOSForm();
    });

    // Save Order button
    document.getElementById('btn-save-order').addEventListener('click', () => {
        saveOrder();
    });

    // Tab buttons switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetTab = btn.getAttribute('data-tab');
            state.tab = targetTab;
            
            const panes = document.querySelectorAll('.tab-pane');
            panes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
            
            // Re-render corresponding tab
            if (targetTab === 'orders-tab') {
                renderOrders();
            } else if (targetTab === 'grab-tab') {
                renderGrabLogs();
            } else if (targetTab === 'stock-tab') {
                renderStock();
            } else if (targetTab === 'summary-tab') {
                renderAnalytics();
            }
        });
    });

    // Order date filters
    document.getElementById('filter-date').addEventListener('change', (e) => {
        const val = e.target.value;
        const customGroup = document.getElementById('custom-date-group');
        if (val === 'custom') {
            customGroup.style.display = 'block';
        } else {
            customGroup.style.display = 'none';
        }
        renderOrders();
    });

    document.getElementById('filter-custom-date').addEventListener('change', () => {
        renderOrders();
    });

    document.getElementById('search-order-customer').addEventListener('input', () => {
        renderOrders();
    });

    // Grab logs search
    document.getElementById('search-grab-rider').addEventListener('input', () => {
        renderGrabLogs();
    });

    // Backup & Restore buttons
    document.getElementById('btn-backup').addEventListener('click', () => {
        document.getElementById('backup-modal').classList.add('active');
    });

    document.getElementById('btn-close-backup-modal').addEventListener('click', () => {
        document.getElementById('backup-modal').classList.remove('active');
    });

    document.getElementById('btn-export-data').addEventListener('click', exportData);
    
    document.getElementById('btn-trigger-import').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', importData);

    document.getElementById('btn-clear-all-data').addEventListener('click', clearAllSystemData);

    // Google Sheets Sync Event Listeners
    document.getElementById('sheet-url-input').addEventListener('input', (e) => {
        state.sheetUrl = e.target.value.trim();
        localStorage.setItem('juice_bar_sheet_url', state.sheetUrl);
    });

    document.getElementById('auto-sync-checkbox').addEventListener('change', (e) => {
        state.autoSync = e.target.checked;
        localStorage.setItem('juice_bar_auto_sync', state.autoSync ? 'true' : 'false');
    });

    document.getElementById('btn-pull-sheet').addEventListener('click', () => pullFromSheets(false));
    document.getElementById('btn-push-sheet').addEventListener('click', () => pushToSheets(false));

    // Grab Manual Log Modal
    document.getElementById('btn-add-grab-manual').addEventListener('click', openGrabManualModal);
    document.getElementById('btn-close-grab-modal').addEventListener('click', closeGrabManualModal);
    document.getElementById('btn-cancel-grab-modal').addEventListener('click', closeGrabManualModal);
    document.getElementById('grab-manual-form').addEventListener('submit', handleGrabManualSubmit);
}

// CHECK IF CUSTOMER HAS EXISTING ORDERS TO SUGGEST APPENDING (Incremental ordering)
function checkCustomerPreviousOrders(custName) {
    const selectedDate = document.getElementById('order-date').value;
    
    // Find active orders for this customer on the selected date
    const userOrders = state.orders.filter(o => o.customerName === custName && o.date === selectedDate);
    if (userOrders.length === 0) return;
    
    // Sort by date/time (newest first)
    userOrders.sort((a,b) => new Date(b.createdTime) - new Date(a.createdTime));
    const latestOrder = userOrders[0];
    
    // Prompt the user if they want to append to the latest order
    const orderDateFormatted = new Date(latestOrder.createdTime).toLocaleDateString('th-TH');
    const itemsCount = Object.values(latestOrder.items).reduce((a, b) => a + b, 0);
    
    const confirmAppend = confirm(
        `พบออเดอร์เดิมของลูกค้า "${custName}" เมื่อวันที่ ${orderDateFormatted} (${itemsCount} ขวด, ${latestOrder.priceDetails.total} บาท)\n\nคุณต้องการ "เพิ่มสินค้าในบิลเดิม" เพื่อสะสมโปรโมชั่นใช่หรือไม่?`
    );
    
    if (confirmAppend) {
        loadOrderForEditing(latestOrder.id);
    }
}

// RENDER BEVERAGES GRID
function renderDrinkGrid() {
    const grid = document.getElementById('beverages-container');
    grid.innerHTML = '';
    
    const filteredDrinks = DRINKS.filter(drink => {
        return drink.nameTH.includes(state.searchQuery) || drink.nameEN.toLowerCase().includes(state.searchQuery);
    });
    
    if (filteredDrinks.length === 0) {
        grid.innerHTML = `<div class="empty-cart-msg" style="grid-column: 1/-1;">ไม่พบน้ำที่ค้นหา</div>`;
        return;
    }
    
    filteredDrinks.forEach(drink => {
        const qtyInCart = state.cart[drink.id] || 0;
        const activeClass = qtyInCart > 0 ? 'active' : '';
        
        const stockQty = state.stock[drink.id] !== undefined ? state.stock[drink.id] : 20;
        let stockLabel = '';
        if (stockQty === 0) {
            stockLabel = `<span class="bev-stock text-danger" style="font-size: 0.75rem; font-weight: bold; display: block; margin-top: 0.15rem;">❌ หมด</span>`;
        } else if (stockQty <= 5) {
            stockLabel = `<span class="bev-stock text-warning" style="font-size: 0.75rem; font-weight: bold; display: block; margin-top: 0.15rem;">⚠️ เหลือ ${stockQty}</span>`;
        } else {
            stockLabel = `<span class="bev-stock text-muted" style="font-size: 0.75rem; display: block; margin-top: 0.15rem;">สต็อก: ${stockQty}</span>`;
        }

        const card = document.createElement('div');
        card.className = `bev-card ${activeClass}`;
        card.setAttribute('style', `--bev-color: ${drink.color}; --bev-color-rgb: ${drink.colorRgb};`);
        
        card.innerHTML = `
            ${qtyInCart > 0 ? `<span class="badge-qty">${qtyInCart}</span>` : ''}
            <div class="bev-icon"><i class="fa-solid ${drink.icon}"></i></div>
            <div>
                <span class="bev-name-th">${drink.nameTH}</span>
                <span class="bev-name-en">${drink.nameEN}</span>
                ${stockLabel}
            </div>
            <div class="bev-controls">
                <button type="button" class="bev-btn minus-btn" title="ลดจำนวน"><i class="fa-solid fa-minus"></i></button>
                <button type="button" class="bev-btn plus-btn" title="เพิ่มจำนวน"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
        
        // Handle increment/decrement clicks
        card.querySelector('.plus-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            changeCartQty(drink.id, 1);
        });
        
        card.querySelector('.minus-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            changeCartQty(drink.id, -1);
        });
        
        // Clicking card anywhere else adds 1
        card.addEventListener('click', () => {
            changeCartQty(drink.id, 1);
        });
        
        grid.appendChild(card);
    });
}

// CHANGE CART QUANTITY
function changeCartQty(drinkId, delta) {
    const currentQty = state.cart[drinkId] || 0;
    const newQty = currentQty + delta;
    
    if (newQty <= 0) {
        delete state.cart[drinkId];
    } else {
        state.cart[drinkId] = newQty;
    }
    
    renderCart();
    renderDrinkGrid();
}

// RENDER CART & LIVE CALCULATIONS
function renderCart() {
    const itemsList = document.getElementById('cart-items-list');
    const calcContainer = document.getElementById('cart-calc');
    const totalQtyEl = document.getElementById('cart-total-qty');
    
    itemsList.innerHTML = '';
    
    const cartKeys = Object.keys(state.cart);
    let totalQty = 0;
    
    if (cartKeys.length === 0) {
        itemsList.innerHTML = `<div class="empty-cart-msg">ยังไม่ได้เลือกน้ำ</div>`;
        calcContainer.style.display = 'none';
        totalQtyEl.textContent = '0 ขวด';
        return;
    }
    
    cartKeys.forEach(drinkId => {
        const drink = DRINKS.find(d => d.id === drinkId);
        const qty = state.cart[drinkId];
        totalQty += qty;
        
        const cartRow = document.createElement('div');
        cartRow.className = 'cart-item';
        cartRow.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-bullet" style="background-color: ${drink.color};"></div>
                <div>
                    <span class="cart-item-name">${drink.nameTH}</span>
                    <span class="bev-name-en">${drink.nameEN}</span>
                </div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-qty-control">
                    <button class="cart-qty-btn" onclick="changeCartQty('${drinkId}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <span style="font-weight: 600; font-size: 0.9rem;">${qty}</span>
                    <button class="cart-qty-btn" onclick="changeCartQty('${drinkId}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
                <span class="cart-item-price">${qty * PRICE_PER_BOTTLE}.-</span>
                <button class="cart-item-delete" onclick="changeCartQty('${drinkId}', -${qty})" title="ลบรายการ"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
        itemsList.appendChild(cartRow);
    });
    
    // Live Calculation
    const pricing = calculateBestPrice(totalQty);
    
    totalQtyEl.textContent = `${totalQty} ขวด`;
    calcContainer.style.display = 'flex';
    document.getElementById('calc-subtotal').textContent = `${totalQty * PRICE_PER_BOTTLE} บาท`;
    
    const discountRow = document.getElementById('calc-discount-row');
    if (pricing.discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('calc-discount').textContent = `-${pricing.discount} บาท`;
        
        let promoDesc = [];
        if (pricing.num7 > 0) promoDesc.push(`โปร 7 ขวด x ${pricing.num7}`);
        if (pricing.num4 > 0) promoDesc.push(`โปร 4 ขวด x ${pricing.num4}`);
        document.getElementById('calc-promo-text').textContent = `(${promoDesc.join(' + ')})`;
    } else {
        discountRow.style.display = 'none';
    }
    
    document.getElementById('calc-total').textContent = `${pricing.total} บาท`;
}

// SAVE ORDER OR UPDATE ORDER
function saveOrder() {
    const customerName = document.getElementById('customer-name').value.trim();
    const orderDate = document.getElementById('order-date').value;
    const deliveryType = document.getElementById('delivery-type').value;
    const grabDriverName = document.getElementById('grab-driver-name').value.trim();
    
    if (!customerName) {
        alert("กรุณากรอกชื่อคนสั่ง / ลูกค้า");
        document.getElementById('customer-name').focus();
        return;
    }
    
    const cartKeys = Object.keys(state.cart);
    if (cartKeys.length === 0) {
        alert("กรุณาเลือกเครื่องดื่มอย่างน้อย 1 ขวด");
        return;
    }
    
    if (deliveryType === 'grab' && !grabDriverName) {
        alert("กรุณากรอกชื่อคนขับ Grab");
        document.getElementById('grab-driver-name').focus();
        return;
    }
    
    const totalQty = Object.values(state.cart).reduce((a, b) => a + b, 0);
    const priceDetails = calculateBestPrice(totalQty);
    
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (state.editingOrderId) {
        // Mode: UPDATE EXISTING ORDER
        const index = state.orders.findIndex(o => o.id === state.editingOrderId);
        if (index !== -1) {
            const oldOrder = state.orders[index];
            const oldGrabDriver = oldOrder.grabDriverName;
            
            // Refund old items to stock
            if (oldOrder.items) {
                for (const drinkId in oldOrder.items) {
                    const oldQty = oldOrder.items[drinkId] || 0;
                    state.stock[drinkId] = (state.stock[drinkId] || 0) + oldQty;
                }
            }
            
            // Deduct new items from stock
            for (const drinkId in state.cart) {
                const newQty = state.cart[drinkId] || 0;
                state.stock[drinkId] = Math.max(0, (state.stock[drinkId] || 0) - newQty);
            }
            
            state.orders[index] = {
                ...oldOrder,
                customerName: customerName,
                date: orderDate, // keeps original unless overwritten
                deliveryType: deliveryType,
                grabDriverName: deliveryType === 'grab' ? grabDriverName : '',
                items: { ...state.cart },
                priceDetails: priceDetails,
                updatedTime: now.toISOString()
            };
            
            // Handle automatic Grab driver log syncing
            syncGrabLogForOrder(state.orders[index], oldGrabDriver);
        }
        state.editingOrderId = null;
        alert("อัปเดตออเดอร์เรียบร้อยแล้ว!");
    } else {
        // Mode: CREATE NEW ORDER
        // Deduct items from stock
        for (const drinkId in state.cart) {
            const qty = state.cart[drinkId] || 0;
            state.stock[drinkId] = Math.max(0, (state.stock[drinkId] || 0) - qty);
        }

        const newOrderId = 'order-' + Date.now();
        const newOrder = {
            id: newOrderId,
            customerName: customerName,
            date: orderDate,
            time: currentTimeStr,
            deliveryType: deliveryType,
            grabDriverName: deliveryType === 'grab' ? grabDriverName : '',
            items: { ...state.cart },
            priceDetails: priceDetails,
            status: 'paid', // defaults to paid
            createdTime: now.toISOString(),
            updatedTime: null
        };
        
        state.orders.push(newOrder);
        
        // Handle Grab Log creation automatically
        if (deliveryType === 'grab') {
            createGrabPickup(newOrder);
        }
        
        alert("บันทึกออเดอร์ใหม่เรียบร้อยแล้ว!");
    }
    
    saveToLocalStorage();
    clearPOSForm();
    
    // Refresh UI
    renderOrders();
    renderGrabLogs();
    renderAnalytics();
}

// SYNC GRAB LOG ENTRIES WHEN ORDER IS UPDATED
function syncGrabLogForOrder(order, oldDriverName) {
    // Delete existing grab log matching this order if delivery type is no longer grab
    if (order.deliveryType !== 'grab') {
        state.grabPickups = state.grabPickups.filter(g => g.orderId !== order.id);
        return;
    }
    
    // Look for existing grab log
    const grabIndex = state.grabPickups.findIndex(g => g.orderId === order.id);
    
    if (grabIndex !== -1) {
        // Update existing grab log
        state.grabPickups[grabIndex].driverName = order.grabDriverName;
        state.grabPickups[grabIndex].customerName = order.customerName;
        state.grabPickups[grabIndex].items = { ...order.items };
    } else {
        // Create new grab log entry
        createGrabPickup(order);
    }
}

// CREATE GRAB PICKUP RECORD FROM ORDER
function createGrabPickup(order) {
    const grabRecord = {
        id: 'grab-' + Date.now(),
        driverName: order.grabDriverName,
        customerName: order.customerName,
        orderId: order.id,
        items: { ...order.items },
        timestamp: order.updatedTime || order.createdTime
    };
    state.grabPickups.push(grabRecord);
}

// LOAD ORDER TO FORMS FOR EDITING (Incremental Ordering)
function loadOrderForEditing(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    state.editingOrderId = order.id;
    state.cart = { ...order.items };
    
    // Fill inputs
    document.getElementById('customer-name').value = order.customerName;
    document.getElementById('order-date').value = order.date;
    document.getElementById('delivery-type').value = order.deliveryType;
    
    const grabDriverInput = document.getElementById('grab-driver-name');
    const grabGroup = document.getElementById('grab-driver-group');
    
    if (order.deliveryType === 'grab') {
        grabGroup.style.display = 'block';
        grabDriverInput.value = order.grabDriverName;
    } else {
        grabGroup.style.display = 'none';
        grabDriverInput.value = '';
    }
    
    // UI update
    document.getElementById('pos-title').innerHTML = `<i class="fa-solid fa-pen-to-square text-secondary"></i> แก้ไขออเดอร์ของ ${order.customerName}`;
    document.getElementById('edit-indicator').style.display = 'inline-block';
    document.getElementById('btn-save-order').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> อัปเดตบิลสะสม`;
    document.getElementById('btn-clear-form').innerHTML = `<i class="fa-solid fa-xmark"></i> ยกเลิกแก้ไข`;
    
    renderDrinkGrid();
    renderCart();
    
    // Scroll POS panel into view if on mobile
    document.querySelector('.pos-panel').scrollIntoView({ behavior: 'smooth' });
}

// CLEAR POS FORM
function clearPOSForm() {
    state.editingOrderId = null;
    state.cart = {};
    
    document.getElementById('customer-name').value = '';
    document.getElementById('order-date').value = getLocalDateString(new Date());
    document.getElementById('delivery-type').value = 'walkin';
    document.getElementById('grab-driver-name').value = '';
    document.getElementById('grab-driver-group').style.display = 'none';
    
    // UI reset
    document.getElementById('pos-title').innerHTML = `<i class="fa-solid fa-cart-plus text-primary"></i> สั่งน้ำขวด / บันทึกการขาย`;
    document.getElementById('edit-indicator').style.display = 'none';
    document.getElementById('btn-save-order').innerHTML = `<i class="fa-solid fa-check"></i> บันทึกออเดอร์`;
    document.getElementById('btn-clear-form').innerHTML = `<i class="fa-solid fa-eraser"></i> ล้างฟอร์ม`;
    
    renderDrinkGrid();
    renderCart();
}

// RENDER ALL ORDERS IN THE LOGS TAB
function renderOrders() {
    const listContainer = document.getElementById('orders-list');
    listContainer.innerHTML = '';
    
    const filterDateVal = document.getElementById('filter-date').value;
    const filterCustomDate = document.getElementById('filter-custom-date').value;
    const searchCust = document.getElementById('search-order-customer').value.trim().toLowerCase();
    
    const todayStr = getLocalDateString(new Date());
    
    let yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);
    
    // Filter orders
    let filteredOrders = state.orders.filter(order => {
        // 1. Date Filter
        if (filterDateVal === 'today' && order.date !== todayStr) return false;
        if (filterDateVal === 'yesterday' && order.date !== yesterdayStr) return false;
        if (filterDateVal === 'custom' && order.date !== filterCustomDate) return false;
        
        // 2. Name Search
        if (searchCust && !order.customerName.toLowerCase().includes(searchCust)) return false;
        
        return true;
    });
    
    // Sort orders: Newest first
    filteredOrders.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    
    // Update Stats counters for filtered set
    let totalQty = 0;
    let totalRevenue = 0;
    
    filteredOrders.forEach(o => {
        totalQty += Object.values(o.items).reduce((sum, q) => sum + q, 0);
        totalRevenue += o.priceDetails.total;
    });
    
    document.getElementById('stats-total-bottles').textContent = totalQty;
    document.getElementById('stats-total-revenue').textContent = totalRevenue.toLocaleString();
    
    if (filteredOrders.length === 0) {
        listContainer.innerHTML = `
            <div class="card glass-card py-4 text-center text-muted">
                <i class="fa-solid fa-receipt" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p>ไม่พบบันทึกออเดอร์ที่ตรงตามเงื่อนไข</p>
            </div>
        `;
        return;
    }
    
    filteredOrders.forEach(order => {
        const orderQty = Object.values(order.items).reduce((a, b) => a + b, 0);
        
        const dateObj = new Date(order.createdTime);
        const dateThai = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        
        const card = document.createElement('div');
        card.className = 'order-card';
        
        // Channel Badge
        let channelBadge = '';
        if (order.deliveryType === 'grab') {
            channelBadge = `<span class="badge badge-warning"><i class="fa-solid fa-helmet-safety"></i> Grab: ${order.grabDriverName}</span>`;
        } else if (order.deliveryType === 'lineman') {
            channelBadge = `<span class="badge badge-primary"><i class="fa-solid fa-motorcycle"></i> Lineman</span>`;
        } else if (order.deliveryType === 'walkin') {
            channelBadge = `<span class="badge badge-success"><i class="fa-solid fa-user-check"></i> รับเอง/หน้าร้าน</span>`;
        } else {
            channelBadge = `<span class="badge badge-outline"><i class="fa-solid fa-paper-plane"></i> อื่นๆ</span>`;
        }
        
        // Generate drink badges
        let drinkBadgesHTML = '';
        Object.keys(order.items).forEach(drinkId => {
            const drink = DRINKS.find(d => d.id === drinkId);
            if (drink) {
                drinkBadgesHTML += `
                    <div class="order-item-badge" style="--bev-color: ${drink.color};">
                        <span>${drink.nameTH}</span>
                        <span class="order-item-qty">x${order.items[drinkId]}</span>
                    </div>
                `;
            }
        });
        
        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <h4 class="order-cust-name">${order.customerName}</h4>
                    <div style="margin-top: 0.25rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${channelBadge}
                    </div>
                </div>
                <div class="order-meta-info">
                    <span class="order-time"><i class="fa-regular fa-clock"></i> บิลวันที่ ${order.date} (${order.time})</span>
                    ${order.updatedTime ? `<span class="order-modified-badge"><i class="fa-solid fa-pen"></i> แก้ไขบิลแล้ว</span>` : ''}
                </div>
            </div>
            <div class="order-details-grid">
                ${drinkBadgesHTML}
            </div>
            <div class="order-card-footer">
                <div class="order-price-info">
                    <span class="order-total-price text-primary">${order.priceDetails.total} บาท</span>
                    ${order.priceDetails.discount > 0 ? `<span class="order-promo-saving"><i class="fa-solid fa-tags"></i> ประหยัดไป ${order.priceDetails.discount} บ.</span>` : ''}
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="loadOrderForEditing('${order.id}')" title="แก้ไขรายการ / ค่อยๆสั่งเพิ่มขวดเพื่อรวมโปร">
                        <i class="fa-solid fa-plus-minus"></i> เพิ่มของ / แก้ไข
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrder('${order.id}')" title="ลบออเดอร์">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// DELETE ORDER
function deleteOrder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (confirm(`คุณต้องการลบออเดอร์ของ "${order.customerName}" ใช่หรือไม่?\n* ข้อมูล Grab ที่ผูกกับบิลนี้จะถูกลบไปด้วย`)) {
        // Refund items to stock
        if (order.items) {
            for (const drinkId in order.items) {
                const qty = order.items[drinkId] || 0;
                state.stock[drinkId] = (state.stock[drinkId] || 0) + qty;
            }
        }

        state.orders = state.orders.filter(o => o.id !== orderId);
        // Also remove automatic Grab logs associated with this order
        state.grabPickups = state.grabPickups.filter(g => g.orderId !== orderId);
        
        saveToLocalStorage();
        renderOrders();
        renderGrabLogs();
        renderAnalytics();
        
        // If we were editing this, clear form
        if (state.editingOrderId === orderId) {
            clearPOSForm();
        }
    }
}

// RENDER GRAB DRIVER LOGS
function renderGrabLogs() {
    const tableBody = document.getElementById('grab-log-list');
    tableBody.innerHTML = '';
    
    const searchVal = document.getElementById('search-grab-rider').value.trim().toLowerCase();
    
    // Filter Grab records
    let filteredGrab = state.grabPickups.filter(grab => {
        const matchesDriver = grab.driverName.toLowerCase().includes(searchVal);
        const matchesCustomer = grab.customerName.toLowerCase().includes(searchVal);
        return matchesDriver || matchesCustomer;
    });
    
    // Sort: Newest first
    filteredGrab.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (filteredGrab.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">ไม่พบประวัติรับของจาก Grab</td>
            </tr>
        `;
        return;
    }
    
    filteredGrab.forEach(g => {
        const dateObj = new Date(g.timestamp);
        const formattedTime = dateObj.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Generate item pills
        let itemPillsHTML = '';
        Object.keys(g.items).forEach(drinkId => {
            const drink = DRINKS.find(d => d.id === drinkId);
            if (drink) {
                itemPillsHTML += `
                    <span class="grab-item-pill" style="border-left: 3px solid ${drink.color};">
                        ${drink.nameTH} x${g.items[drinkId]}
                    </span>
                `;
            }
        });
        
        const customerDisplay = g.customerName ? `คุณ ${g.customerName}` : `<span class="text-muted">-</span>`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${formattedTime}</strong></td>
            <td><span class="text-warning"><i class="fa-solid fa-helmet-safety"></i> ${g.driverName}</span></td>
            <td>
                <div class="grab-item-list">
                    ${itemPillsHTML}
                </div>
            </td>
            <td>${customerDisplay}</td>
            <td>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="printGrabSlip('${g.id}')" title="แสดงใบรับของ"><i class="fa-solid fa-receipt"></i> ใบรับของ</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteGrabLog('${g.id}')" title="ลบข้อมูล"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// DELETE GRAB LOG RECORD
function deleteGrabLog(grabId) {
    const grab = state.grabPickups.find(g => g.id === grabId);
    if (!grab) return;
    
    if (confirm(`คุณต้องการลบข้อมูลการรับของของคนขับ "${grab.driverName}" ใช่หรือไม่?`)) {
        // If manual grab pickup (no order linked), refund stock
        if (!grab.orderId && grab.items) {
            for (const drinkId in grab.items) {
                const qty = grab.items[drinkId] || 0;
                state.stock[drinkId] = (state.stock[drinkId] || 0) + qty;
            }
        }

        state.grabPickups = state.grabPickups.filter(g => g.id !== grabId);
        
        // Note: We don't delete the order, just disconnect the connection or keep order as is
        // Let's find the associated order and clear its grab rider details or keep them.
        // It's safer to keep order details but notify that grab delivery log was removed.
        const orderIndex = state.orders.findIndex(o => o.id === grab.orderId);
        if (orderIndex !== -1) {
            // Option: convert order delivery type back or clear rider name? 
            // We just keep order but delete the specific grab log.
        }
        
        saveToLocalStorage();
        renderGrabLogs();
        renderAnalytics();
    }
}

// SHOW / PRINT GRAB SLIP
function printGrabSlip(grabId) {
    const grab = state.grabPickups.find(g => g.id === grabId);
    if (!grab) return;
    
    const dateObj = new Date(grab.timestamp);
    const dateStr = dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let itemsHTML = '';
    let totalQty = 0;
    Object.keys(grab.items).forEach(drinkId => {
        const drink = DRINKS.find(d => d.id === drinkId);
        if (drink) {
            const qty = grab.items[drinkId];
            totalQty += qty;
            itemsHTML += `<tr><td style="padding:5px 0;">${drink.nameTH} (${drink.nameEN})</td><td style="text-align:right;">${qty} ขวด</td></tr>`;
        }
    });
    
    // Open print window
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>ใบรับของ Grab - Juice Bar Tracker</title>
            <style>
                body { font-family: 'Prompt', 'Sarabun', sans-serif; padding: 20px; color: #333; line-height:1.4; font-size: 14px;}
                .slip-container { border: 1px dashed #ccc; padding: 15px; border-radius: 5px; max-width: 320px; margin: 0 auto; }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                hr { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                .footer { font-size: 12px; color: #777; margin-top: 20px; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            <div class="slip-container">
                <h3 class="text-center" style="margin:0 0 5px 0;">JUICE BAR TRACKER</h3>
                <p class="text-center" style="margin:0; font-size:12px;">** ใบรับของสำหรับไรเดอร์ **</p>
                <hr>
                <p><span class="bold">ผู้รับของ (ไรเดอร์ Grab):</span> ${grab.driverName}</p>
                <p><span class="bold">บิลลูกค้า:</span> ${grab.customerName || 'ทั่วไป'}</p>
                <p><span class="bold">เวลาที่บันทึก:</span> ${dateStr}</p>
                <hr>
                <table style="margin-top: 10px;">
                    <thead>
                        <tr style="border-bottom: 1px solid #eee;"><th style="text-align:left;">รายการน้ำ</th><th style="text-align:right;">จำนวน</th></tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <hr>
                <p style="text-align:right; margin:0;"><span class="bold">รวมทั้งหมด:</span> ${totalQty} ขวด</p>
                <hr>
                <p class="text-center footer">ขอบคุณที่ใช้บริการครับ/ค่ะ</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// OPEN GRAB MANUAL MODAL
function openGrabManualModal() {
    const modal = document.getElementById('grab-manual-modal');
    modal.classList.add('active');
    
    // Preset datetime input
    const now = new Date();
    // Offset local timezone ISO string
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
    document.getElementById('grab-modal-time').value = localISOTime;
    
    // Render drinks list in modal with inputs
    const listDiv = document.getElementById('grab-modal-drinks-list');
    listDiv.innerHTML = DRINKS.map(drink => `
        <div class="grab-drink-row">
            <span class="grab-drink-row-name">${drink.nameTH}</span>
            <div class="cart-qty-control">
                <button type="button" class="cart-qty-btn modal-minus-btn" data-id="${drink.id}"><i class="fa-solid fa-minus"></i></button>
                <input type="number" class="modal-drink-input" id="modal-qty-${drink.id}" value="0" min="0" style="width: 40px; text-align: center; border: none; background: transparent; color: white; font-weight: bold;" readonly>
                <button type="button" class="cart-qty-btn modal-plus-btn" data-id="${drink.id}"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
    `).join('');
    
    // Hook up modal counters
    listDiv.querySelectorAll('.modal-plus-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const input = document.getElementById(`modal-qty-${id}`);
            input.value = parseInt(input.value) + 1;
        });
    });
    
    listDiv.querySelectorAll('.modal-minus-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const input = document.getElementById(`modal-qty-${id}`);
            const val = parseInt(input.value);
            if (val > 0) input.value = val - 1;
        });
    });
}

// CLOSE GRAB MANUAL MODAL
function closeGrabManualModal() {
    document.getElementById('grab-manual-modal').classList.remove('active');
    document.getElementById('grab-manual-form').reset();
}

// SUBMIT GRAB MANUAL LOG
function handleGrabManualSubmit(e) {
    e.preventDefault();
    
    const driverName = document.getElementById('grab-modal-driver').value.trim();
    const customerName = document.getElementById('grab-modal-customer').value.trim();
    const timestampVal = document.getElementById('grab-modal-time').value;
    
    // Extract chosen drinks
    let items = {};
    let totalQty = 0;
    DRINKS.forEach(drink => {
        const val = parseInt(document.getElementById(`modal-qty-${drink.id}`).value) || 0;
        if (val > 0) {
            items[drink.id] = val;
            totalQty += val;
        }
    });
    
    if (totalQty === 0) {
        alert("กรุณาเลือกขวดน้ำที่ Grab มารับอย่างน้อย 1 ขวด");
        return;
    }
    
    // Deduct items from stock
    for (const drinkId in items) {
        const qty = items[drinkId] || 0;
        state.stock[drinkId] = Math.max(0, (state.stock[drinkId] || 0) - qty);
    }

    const record = {
        id: 'grab-' + Date.now(),
        driverName: driverName,
        customerName: customerName,
        orderId: null, // manual log has no orderId linked
        items: items,
        timestamp: timestampVal ? new Date(timestampVal).toISOString() : new Date().toISOString()
    };
    
    state.grabPickups.push(record);
    saveToLocalStorage();
    
    closeGrabManualModal();
    renderGrabLogs();
    renderAnalytics();
    
    alert("บันทึกการมารับของของ Grab ไรเดอร์เรียบร้อย!");
}

// RENDER STATS & ANALYTICS
function renderAnalytics() {
    const todayStr = getLocalDateString(new Date());
    
    // 1. CALCULATE REVENUE/BOTTLES
    let todayRevenue = 0;
    let todayBottles = 0;
    let totalRevenue = 0;
    let totalBottles = 0;
    let totalDiscount = 0;
    
    // Popularity tracker (drinkId -> count)
    let popTracker = {};
    DRINKS.forEach(d => popTracker[d.id] = 0);
    
    // Delivery stats
    let deliveryStats = { walkin: 0, grab: 0, lineman: 0, other: 0 };
    
    state.orders.forEach(order => {
        const orderQty = Object.values(order.items).reduce((a, b) => a + b, 0);
        
        // Sum totals
        totalBottles += orderQty;
        totalRevenue += order.priceDetails.total;
        totalDiscount += order.priceDetails.discount;
        
        // Channel stats
        const type = order.deliveryType;
        if (deliveryStats.hasOwnProperty(type)) {
            deliveryStats[type]++;
        } else {
            deliveryStats.other++;
        }
        
        // Today stats
        if (order.date === todayStr) {
            todayBottles += orderQty;
            todayRevenue += order.priceDetails.total;
        }
        
        // Accumulate popularity
        Object.keys(order.items).forEach(drinkId => {
            if (popTracker.hasOwnProperty(drinkId)) {
                popTracker[drinkId] += order.items[drinkId];
            }
        });
    });
    
    // Add manual grab logs items to popularity as well, if they are not linked to any order
    // to keep records accurate. Let's check manual logs:
    state.grabPickups.forEach(grab => {
        if (!grab.orderId) { // only count manual ones, order-linked are already counted in order loop
            Object.keys(grab.items).forEach(drinkId => {
                if (popTracker.hasOwnProperty(drinkId)) {
                    popTracker[drinkId] += grab.items[drinkId];
                }
            });
        }
    });
    
    // Update counters in DOM
    document.getElementById('analytics-today-revenue').textContent = `${todayRevenue.toLocaleString()} บาท`;
    document.getElementById('analytics-today-bottles').textContent = `${todayBottles} ขวด`;
    document.getElementById('analytics-total-revenue-all').textContent = `${totalRevenue.toLocaleString()} บาท`;
    document.getElementById('analytics-total-bottles-all').textContent = `${totalBottles} ขวด`;
    document.getElementById('analytics-total-discount').textContent = `${totalDiscount.toLocaleString()} บาท`;
    
    document.getElementById('stat-delivery-walkin').textContent = `${deliveryStats.walkin} บิล`;
    document.getElementById('stat-delivery-grab').textContent = `${deliveryStats.grab} บิล`;
    document.getElementById('stat-delivery-lineman').textContent = `${deliveryStats.lineman} บิล`;
    document.getElementById('stat-delivery-other').textContent = `${deliveryStats.other} บิล`;
    
    // 2. RENDER POPULAR DRINKS (Top 5)
    const sortedPopular = Object.keys(popTracker)
        .map(id => {
            const drink = DRINKS.find(d => d.id === id);
            return {
                id: id,
                nameTH: drink ? drink.nameTH : id,
                qty: popTracker[id]
            };
        })
        .filter(item => item.qty > 0)
        .sort((a, b) => b.qty - a.qty);
        
    const popularContainer = document.getElementById('popular-drinks-list');
    
    if (sortedPopular.length === 0) {
        popularContainer.innerHTML = `<div class="text-muted text-center py-4">ยังไม่มีข้อมูลยอดขายสะสม</div>`;
        return;
    }
    
    const maxQty = sortedPopular[0].qty; // For scale percentage
    
    const top5 = sortedPopular.slice(0, 5);
    popularContainer.innerHTML = top5.map((item, idx) => {
        const percentage = maxQty > 0 ? (item.qty / maxQty) * 100 : 0;
        return `
            <div class="ranking-item">
                <div class="ranking-drink-info">
                    <span class="ranking-num">${idx + 1}</span>
                    <span class="ranking-name">${item.nameTH}</span>
                </div>
                <div class="ranking-bar-wrapper">
                    <div class="ranking-bar" style="width: ${percentage}%"></div>
                </div>
                <span class="ranking-qty text-primary">${item.qty} ขวด</span>
            </div>
        `;
    }).join('');
}

// DATA EXPORT (JSON FILE DOWNLOAD)
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const now = new Date();
    const dateStr = getLocalDateString(now);
    downloadAnchor.setAttribute("download", `juice_bar_backup_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// DATA IMPORT (JSON FILE UPLOAD)
function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);
            if (parsed.orders || parsed.grabPickups) {
                state.orders = parsed.orders || [];
                state.grabPickups = parsed.grabPickups || [];
                saveToLocalStorage();
                
                // Reset form state
                clearPOSForm();
                
                // Refresh UI
                renderOrders();
                renderGrabLogs();
                renderAnalytics();
                
                alert("กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว!");
                document.getElementById('backup-modal').classList.remove('active');
            } else {
                alert("ไฟล์สำรองไม่ถูกต้อง หรือรูปแบบข้อมูลไม่ครบถ้วน");
            }
        } catch (err) {
            alert("ไม่สามารถอ่านไฟล์ได้ กรุณาใช้ไฟล์ข้อมูลสำรอง .json ที่ดาวน์โหลดจากระบบ");
        }
    };
    reader.readAsText(file);
}

// CLEAR ALL SYSTEM DATA
function clearAllSystemData() {
    if (confirm("🚨 คำเตือน! คุณต้องการล้างข้อมูลยอดขายและคนขับ Grab ทั้งหมดหรือไม่?\nข้อมูลทั้งหมดจะถูกลบอย่างถาวรและไม่สามารถกู้กลับคืนได้!")) {
        state.orders = [];
        state.grabPickups = [];
        saveToLocalStorage();
        
        clearPOSForm();
        renderOrders();
        renderGrabLogs();
        renderAnalytics();
        
        document.getElementById('backup-modal').classList.remove('active');
        alert("ล้างข้อมูลทั้งหมดในระบบแล้ว");
    }
}

// GOOGLE SHEETS SYNC MODULE
async function pullFromSheets(isSilent = false) {
    if (!state.sheetUrl) {
        if (!isSilent) alert("กรุณาระบุ Google Apps Script Web App URL ก่อนดึงข้อมูล");
        return;
    }
    
    const pullBtn = document.getElementById('btn-pull-sheet');
    const originalText = pullBtn.innerHTML;
    
    if (!isSilent) {
        pullBtn.disabled = true;
        pullBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดึงข้อมูล...';
    }
    
    try {
        const response = await fetch(state.sheetUrl);
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        
        const data = await response.json();
        if (data && (data.orders || data.grabPickups || data.stock)) {
            state.orders = data.orders || [];
            state.grabPickups = data.grabPickups || [];
            state.stock = data.stock || {};
            
            // Ensure all drinks in database have a stock quantity (default to 20 if not set)
            DRINKS.forEach(drink => {
                if (state.stock[drink.id] === undefined) {
                    state.stock[drink.id] = 20;
                }
            });
            
            // Save to LocalStorage skipping the auto-push sync loop
            saveToLocalStorage(true);
            
            // Refresh POS UI
            renderOrders();
            renderGrabLogs();
            renderStock();
            renderAnalytics();
            
            if (!isSilent) {
                alert("ดึงข้อมูลจาก Google Sheets สำเร็จเรียบร้อยแล้ว!");
            } else {
                console.log("Auto-pulled from Google Sheets successfully.");
            }
        } else {
            if (!isSilent) alert("ไม่พบข้อมูล หรือรูปแบบข้อมูลในชีตไม่ถูกต้อง");
        }
    } catch (err) {
        console.error("Failed to pull from Google Sheets:", err);
        if (!isSilent) {
            alert("ดึงข้อมูลล้มเหลว: " + err.message + "\n\nกรุณาตรวจสอบว่า:\n1. ลิงก์ URL ถูกต้อง\n2. ตั้งค่า Deploy ใน Apps Script เป็นแบบ 'Anyone' (ทุกคน)\n3. บัญชีที่ใช้เปิดสิทธิ์เข้าถึงสาธารณะเรียบร้อยแล้ว");
        }
    } finally {
        if (!isSilent) {
            pullBtn.disabled = false;
            pullBtn.innerHTML = originalText;
        }
    }
}

async function pushToSheets(isAuto = false) {
    if (!state.sheetUrl) {
        if (!isAuto) alert("กรุณาระบุ Google Apps Script Web App URL ก่อนบันทึกข้อมูล");
        return;
    }
    
    const pushBtn = document.getElementById('btn-push-sheet');
    const originalText = pushBtn.innerHTML;
    
    if (!isAuto) {
        pushBtn.disabled = true;
        pushBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    }
    
    try {
        const payload = JSON.stringify({
            orders: state.orders,
            grabPickups: state.grabPickups,
            stock: state.stock
        });
        
        const url = `${state.sheetUrl}?action=save&data=${encodeURIComponent(payload)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        
        const result = await response.json();
        if (result && result.status === 'success') {
            if (!isAuto) {
                alert("บันทึกข้อมูลลง Google Sheets สำเร็จเรียบร้อยแล้ว!");
            } else {
                console.log("Auto-synced to Google Sheets.");
            }
        } else {
            throw new Error(result ? result.message : "ระบบฝั่งชีตตอบรับล้มเหลว");
        }
    } catch (err) {
        console.error("Failed to push to Google Sheets:", err);
        if (!isAuto) {
            alert("บันทึกข้อมูลลงชีตล้มเหลว: " + err.message);
        }
    } finally {
        if (!isAuto) {
            pushBtn.disabled = false;
            pushBtn.innerHTML = originalText;
        }
    }
}

// RENDER STOCK TABLE
function renderStock() {
    const listContainer = document.getElementById('stock-list-container');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    DRINKS.forEach(drink => {
        const qty = state.stock[drink.id] !== undefined ? state.stock[drink.id] : 20;
        
        let statusBadge = '';
        if (qty === 0) {
            statusBadge = '<span class="badge badge-danger">❌ หมด</span>';
        } else if (qty <= 5) {
            statusBadge = '<span class="badge badge-warning">⚠️ ใกล้หมด</span>';
        } else {
            statusBadge = '<span class="badge badge-success">ปกติ</span>';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${drink.color};"></div>
                    <div style="text-align: left;">
                        <strong style="color: #fff;">${drink.nameTH}</strong>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">${drink.nameEN}</div>
                    </div>
                </div>
            </td>
            <td style="text-align: center;">
                <span id="stock-val-display-${drink.id}" style="font-size: 1.1rem; font-weight: 700; color: #fff;">${qty}</span>
            </td>
            <td style="text-align: center;">${statusBadge}</td>
            <td>
                <div class="stock-qty-control" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                    <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" onclick="adjustStockValue('${drink.id}', -5)">-5</button>
                    <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" onclick="adjustStockValue('${drink.id}', -1)">-1</button>
                    <input type="number" id="stock-input-${drink.id}" value="${qty}" min="0" style="width: 55px; text-align: center; font-weight: bold; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); color: #fff; padding: 0.25rem 0.4rem; border-radius: var(--radius-sm);" onchange="updateStockFromInput('${drink.id}', this.value)">
                    <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" onclick="adjustStockValue('${drink.id}', 1)">+1</button>
                    <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" onclick="adjustStockValue('${drink.id}', 5)">+5</button>
                </div>
            </td>
        `;
        listContainer.appendChild(row);
    });
}

// ADJUST STOCK BY DELTA
function adjustStockValue(drinkId, delta) {
    const currentVal = state.stock[drinkId] !== undefined ? state.stock[drinkId] : 20;
    const newVal = Math.max(0, currentVal + delta);
    state.stock[drinkId] = newVal;
    
    saveToLocalStorage();
    renderStock();
    renderDrinkGrid(); // Update POS cards stock indicator as well
}

// UPDATE STOCK DIRECTLY FROM INPUT
function updateStockFromInput(drinkId, value) {
    const newVal = Math.max(0, parseInt(value) || 0);
    state.stock[drinkId] = newVal;
    
    saveToLocalStorage();
    renderStock();
    renderDrinkGrid();
}

// RUN ON LOAD
window.onload = init;
