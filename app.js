// DRINK DATABASE
const DRINKS = [
    { id: 'oishi', nameTH: 'โออิชิ', nameEN: 'Oishi', category: 'tea', color: '#4ade80', colorRgb: '74, 222, 128', icon: 'fa-leaf' },
    { id: 'grape', nameTH: 'องุ่นเคียวโฮ', nameEN: 'Kyoho Grape', category: 'fruit', color: '#c084fc', colorRgb: '192, 132, 252', icon: 'fa-wine-glass' },
    { id: 'bitter', nameTH: 'เดิมขม', nameEN: 'Original Bitter', category: 'dark', color: '#94a3b8', colorRgb: '148, 163, 184', icon: 'fa-mug-hot' },
    { id: 'sweet', nameTH: 'เดิมหวาน', nameEN: 'Original Sweet', category: 'amber', color: '#fbbf24', colorRgb: '251, 191, 36', icon: 'fa-cookie' },
    { id: 'honey-lemon', nameTH: 'น้ำผึ้งมะนาว', nameEN: 'Honey Lemon', category: 'yellow', color: '#fde047', colorRgb: '253, 224, 71', icon: 'fa-lemon' },
    { id: 'blueberry', nameTH: 'บลูเบอร์รี่', nameEN: 'Blueberry', category: 'fruit', color: '#38bdf8', colorRgb: '56, 189, 248', icon: 'fa-seedling' },
    { id: 'yogurt', nameTH: 'โยเกิร์ต', nameEN: 'Yogurt', category: 'yogurt', color: '#f472b6', colorRgb: '244, 114, 182', icon: 'fa-cheese' },
    { id: 'strawberry-yogurt', nameTH: 'โยเกิร์ตสตอเบอรี่', nameEN: 'Strawberry Yogurt', category: 'yogurt', color: '#ec4899', colorRgb: '236, 72, 153', icon: 'fa-ice-cream' },
    { id: 'strawberry', nameTH: 'สตอเบอรี่', nameEN: 'Strawberry', category: 'fruit', color: '#f87171', colorRgb: '248, 113, 113', icon: 'fa-apple-whole' },
    { id: 'apple', nameTH: 'แอปเปิ้ล', nameEN: 'Apple', category: 'fruit', color: '#fb7185', colorRgb: '251, 113, 133', icon: 'fa-apple-whole' },
    { id: 'greentea', nameTH: 'ชาเขียว', nameEN: 'Green Tea', category: 'tea', color: '#34d399', colorRgb: '52, 211, 153', icon: 'fa-mug-hot' },
    { id: 'taro', nameTH: 'เผือก', nameEN: 'Taro', category: 'yogurt', color: '#a78bfa', colorRgb: '167, 139, 250', icon: 'fa-egg' },
    { id: 'cocoa', nameTH: 'โกโก้', nameEN: 'Cocoa', category: 'cocoa', color: '#a16207', colorRgb: '161, 98, 7', icon: 'fa-mug-hot' },
    { id: 'watermelon', nameTH: 'แตงโม', nameEN: 'Watermelon', category: 'fruit', color: '#fda4af', colorRgb: '253, 164, 175', icon: 'fa-lemon' }
];

const PRICE_PER_BOTTLE = 80;

const SHEET_URL_KEY = 'juice_bar_sheet_url';
const AUTO_SYNC_KEY = 'juice_bar_auto_sync';
let sheetUrl = '';
let autoSync = false;

// STATE MANAGEMENT
let state = {
    orders: [],
    grabPickups: [],
    editingOrderId: null,
    cart: {}, // drinkId -> quantity
    searchQuery: '',
    tab: 'orders-tab'
};

// LOAD INITIAL STATE FROM LOCAL STORAGE
async function init() {
    // Set default dates
    const todayStr = getLocalDateString(new Date());
    document.getElementById('order-date').value = todayStr;
    document.getElementById('filter-custom-date').value = todayStr;
    
    // Bind UI elements & Listeners
    setupClock();
    setupEventListeners();

    // Load Google Sheets Settings
    sheetUrl = localStorage.getItem(SHEET_URL_KEY) || '';
    autoSync = localStorage.getItem(AUTO_SYNC_KEY) === 'true';
    document.getElementById('sheet-url-input').value = sheetUrl;
    document.getElementById('auto-sync-checkbox').checked = autoSync;
    
    // Load state from local server database.json or fall back to localStorage
    let loaded = false;
    try {
        const res = await fetch('/api/data');
        if (res.ok) {
            const parsed = await res.json();
            if (parsed.orders || parsed.grabPickups) {
                state.orders = parsed.orders || [];
                state.grabPickups = parsed.grabPickups || [];
                loaded = true;
                console.log("State loaded successfully from server database.json");
            }
        }
    } catch (e) {
        console.warn("Failed to fetch from server database, falling back to localStorage", e);
    }
    
    if (!loaded) {
        const savedState = localStorage.getItem('juice_bar_tracker_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                state.orders = parsed.orders || [];
                state.grabPickups = parsed.grabPickups || [];
                console.log("State loaded from localStorage");
            } catch (e) {
                console.error("Error parsing saved state", e);
            }
        }
    }

    // Auto pull from Google Sheets on start if URL exists (overwrites local if remote has data)
    if (sheetUrl) {
        await pullFromSheets();
    }
    
    renderDrinkGrid();
    renderCart();
    renderOrders();
    renderGrabLogs();
    renderAnalytics();
}

// SAVE STATE TO LOCAL STORAGE & SERVER DATABASE
async function saveToLocalStorage() {
    const stateStr = JSON.stringify({
        orders: state.orders,
        grabPickups: state.grabPickups
    });
    
    // Save to localStorage
    localStorage.setItem('juice_bar_tracker_state', stateStr);
    
    // Save to server database.json
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: stateStr
        });
    } catch (e) {
        console.warn("Could not save state to local API, saved to localStorage only", e);
    }

    // Auto Sync to Google Sheets if configured
    if (autoSync && sheetUrl) {
        pushToSheets(false);
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
function calculateBestPrice(quantity, deliveryType) {
    if (quantity <= 0) {
        return { total: 0, num7: 0, num4: 0, num1: 0, discount: 0 };
    }
    
    if (deliveryType === 'grab') {
        const grabPrice = 67.90;
        const total = quantity * grabPrice;
        const normalPrice = quantity * PRICE_PER_BOTTLE;
        const discount = normalPrice - total;
        return {
            total: Math.round(total * 100) / 100,
            num7: 0,
            num4: 0,
            num1: quantity,
            discount: Math.round(discount * 100) / 100
        };
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
        // Always hide grab driver group since we don't need driver names
        grabDriverGroup.style.display = 'none';
        renderCart();
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

    // Customer / Table change event listener
    const customerSelect = document.getElementById('customer-name');
    customerSelect.addEventListener('change', (e) => {
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
        
        // Check if there are active orders for this table/source to suggest appending
        checkCustomerPreviousOrders(val);
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

    // Google Sheets sync listeners
    document.getElementById('sheet-url-input').addEventListener('change', (e) => {
        sheetUrl = e.target.value.trim();
        localStorage.setItem(SHEET_URL_KEY, sheetUrl);
    });
    document.getElementById('auto-sync-checkbox').addEventListener('change', (e) => {
        autoSync = e.target.checked;
        localStorage.setItem(AUTO_SYNC_KEY, autoSync);
    });
    document.getElementById('btn-pull-sheet').addEventListener('click', pullFromSheets);
    document.getElementById('btn-push-sheet').addEventListener('click', () => pushToSheets(false));

    // Grab Manual Log Modal
    document.getElementById('btn-add-grab-manual').addEventListener('click', openGrabManualModal);
    document.getElementById('btn-close-grab-modal').addEventListener('click', closeGrabManualModal);
    document.getElementById('btn-cancel-grab-modal').addEventListener('click', closeGrabManualModal);
    document.getElementById('grab-manual-form').addEventListener('submit', handleGrabManualSubmit);
}

// CHECK IF CUSTOMER HAS EXISTING ORDERS TO SUGGEST APPENDING (Incremental ordering)
function checkCustomerPreviousOrders(custName) {
    const todayStr = getLocalDateString(new Date());
    
    // Find active orders for this customer
    const userOrders = state.orders.filter(o => o.customerName === custName);
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
        
        const card = document.createElement('div');
        card.className = `bev-card ${activeClass}`;
        card.setAttribute('style', `--bev-color: ${drink.color}; --bev-color-rgb: ${drink.colorRgb};`);
        
        card.innerHTML = `
            ${qtyInCart > 0 ? `<span class="badge-qty">${qtyInCart}</span>` : ''}
            <div class="bev-icon"><i class="fa-solid ${drink.icon}"></i></div>
            <div>
                <span class="bev-name-th">${drink.nameTH}</span>
                <span class="bev-name-en">${drink.nameEN}</span>
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
    const deliveryType = document.getElementById('delivery-type').value;
    const pricing = calculateBestPrice(totalQty, deliveryType);
    
    totalQtyEl.textContent = `${totalQty} ขวด`;
    calcContainer.style.display = 'flex';
    document.getElementById('calc-subtotal').textContent = `${(totalQty * PRICE_PER_BOTTLE).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;
    
    const discountRow = document.getElementById('calc-discount-row');
    if (pricing.discount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('calc-discount').textContent = `-${pricing.discount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;
        
        if (deliveryType === 'grab') {
            document.getElementById('calc-promo-text').textContent = `(ราคาพิเศษ Grab 67.90 บ./ขวด)`;
        } else {
            let promoDesc = [];
            if (pricing.num7 > 0) promoDesc.push(`โปร 7 ขวด x ${pricing.num7}`);
            if (pricing.num4 > 0) promoDesc.push(`โปร 4 ขวด x ${pricing.num4}`);
            document.getElementById('calc-promo-text').textContent = `(${promoDesc.join(' + ')})`;
        }
    } else {
        discountRow.style.display = 'none';
    }
    
    document.getElementById('calc-total').textContent = `${pricing.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;;
}

// SAVE ORDER OR UPDATE ORDER
function saveOrder() {
    const customerName = document.getElementById('customer-name').value.trim();
    const orderDate = document.getElementById('order-date').value;
    const deliveryType = document.getElementById('delivery-type').value;
    const grabDriverName = document.getElementById('grab-driver-name').value.trim();
    
    if (!customerName) {
        alert("กรุณาเลือกแหล่งออเดอร์ / โต๊ะ");
        document.getElementById('customer-name').focus();
        return;
    }
    
    const cartKeys = Object.keys(state.cart);
    if (cartKeys.length === 0) {
        alert("กรุณาเลือกเครื่องดื่มอย่างน้อย 1 ขวด");
        return;
    }
    
    const totalQty = Object.values(state.cart).reduce((a, b) => a + b, 0);
    const priceDetails = calculateBestPrice(totalQty, deliveryType);
    
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (state.editingOrderId) {
        // Mode: UPDATE EXISTING ORDER
        const index = state.orders.findIndex(o => o.id === state.editingOrderId);
        if (index !== -1) {
            const oldOrder = state.orders[index];
            
            // Check if delivery type was changed to Grab or Grab driver updated
            const oldGrabDriver = oldOrder.grabDriverName;
            
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
    
    document.getElementById('customer-name').value = 'กลับบ้าน';
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
    document.getElementById('stats-total-revenue').textContent = totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    
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
            channelBadge = `<span class="badge badge-warning"><i class="fa-solid fa-helmet-safety"></i> Grab</span>`;
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
                    <span class="order-total-price text-primary">${order.priceDetails.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท</span>
                    ${order.priceDetails.discount > 0 ? `<span class="order-promo-saving"><i class="fa-solid fa-tags"></i> ประหยัดไป ${order.priceDetails.discount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บ.</span>` : ''}
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
            <td><span class="text-warning"><i class="fa-solid fa-helmet-safety"></i> Grab</span></td>
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
                <p><span class="bold">ช่องทางจัดส่ง:</span> Grab Delivery</p>
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
    document.getElementById('analytics-today-revenue').textContent = `${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;
    document.getElementById('analytics-today-bottles').textContent = `${todayBottles} ขวด`;
    document.getElementById('analytics-total-revenue-all').textContent = `${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;
    document.getElementById('analytics-total-bottles-all').textContent = `${totalBottles} ขวด`;
    document.getElementById('analytics-total-discount').textContent = `${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;
    
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

// GOOGLE SHEETS CLOUD SYNC MODULE
async function pullFromSheets() {
    if (!sheetUrl) return;
    showSyncStatus('กำลังดึงข้อมูลจาก Google Sheets...', '#fbbf24');
    try {
        const res = await fetch(sheetUrl);
        if (!res.ok) throw new Error('Network response was not ok');
        const remoteData = await res.json();
        if (remoteData && (remoteData.orders || remoteData.grabPickups)) {
            state.orders = remoteData.orders || [];
            state.grabPickups = remoteData.grabPickups || [];
            
            // Save to local database.json and localStorage
            const stateStr = JSON.stringify({
                orders: state.orders,
                grabPickups: state.grabPickups
            });
            localStorage.setItem('juice_bar_tracker_state', stateStr);
            try {
                await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: stateStr
                });
            } catch (err) {}
            
            renderOrders();
            renderGrabLogs();
            renderAnalytics();
            showSyncStatus('ซิงค์ข้อมูลจากคลาวด์สำเร็จ ✅', '#34d399');
        } else if (remoteData && Object.keys(remoteData).length === 0) {
            // Sheet is empty, initialize it with local data
            await pushToSheets(true);
        }
    } catch (e) {
        console.error('Fetch failed', e);
        showSyncStatus('ดึงข้อมูลล้มเหลว ❌', '#f87171');
    }
}

async function pushToSheets(isInit = false) {
    if (!sheetUrl) return;
    showSyncStatus(isInit ? 'กำลังสร้างข้อมูลบนคลาวด์...' : 'กำลังอัปเดตข้อมูลขึ้นคลาวด์...', '#fbbf24');
    try {
        const payload = JSON.stringify({
            orders: state.orders,
            grabPickups: state.grabPickups
        });
        const res = await fetch(`${sheetUrl}?action=save&data=${encodeURIComponent(payload)}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const result = await res.json();
        if (result && result.status === 'success') {
            showSyncStatus(isInit ? 'เชื่อมโยงคลาวด์สำเร็จ ✅' : 'บันทึกขึ้นคลาวด์สำเร็จ ✅', '#34d399');
        } else {
            throw new Error('Save status not success');
        }
    } catch (e) {
        console.error('Save failed', e);
        showSyncStatus('บันทึกลงคลาวด์ล้มเหลว ❌', '#f87171');
    }
}

function showSyncStatus(msg, color) {
    const el = document.getElementById('sheet-sync-status');
    if (el) {
        el.textContent = msg;
        el.style.color = color;
        el.style.display = 'block';
        setTimeout(() => {
            if (el.textContent === msg) {
                el.style.display = 'none';
            }
        }, 4000);
    }
}

// RUN ON LOAD
window.onload = init;
