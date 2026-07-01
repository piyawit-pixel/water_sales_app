const DRINKS = [
    { id: 'oishi', nameTH: 'โออิชิ', nameEN: 'Oishi', category: 'tea', color: '#8FA87B', colorRgb: '143, 168, 123', icon: 'fa-leaf', capColor: 'น้ำเงิน' },
    { id: 'grape', nameTH: 'องุ่นเคียวโฮ', nameEN: 'Kyoho Grape', category: 'fruit', color: '#A28AA8', colorRgb: '162, 138, 168', icon: 'fa-wine-glass', capColor: 'ขาว' },
    { id: 'bitter', nameTH: 'เดิมขม', nameEN: 'Original Bitter', category: 'dark', color: '#7E8578', colorRgb: '126, 133, 120', icon: 'fa-mug-hot', capColor: 'ดำ' },
    { id: 'sweet', nameTH: 'เดิมหวาน', nameEN: 'Original Sweet', category: 'amber', color: '#DDB87B', colorRgb: '221, 184, 123', icon: 'fa-cookie', capColor: 'แดง' },
    { id: 'honey-lemon', nameTH: 'น้ำผึ้งมะนาว', nameEN: 'Honey Lemon', category: 'yellow', color: '#E0C068', colorRgb: '224, 192, 104', icon: 'fa-lemon', capColor: 'ม่วง' },
    { id: 'blueberry', nameTH: 'บลูเบอร์รี่', nameEN: 'Blueberry', category: 'fruit', color: '#7B94B8', colorRgb: '123, 148, 184', icon: 'fa-droplet', capColor: 'ฟ้า' },
    { id: 'yogurt', nameTH: 'โยเกิร์ต', nameEN: 'Yogurt', category: 'yogurt', color: '#D2A0A8', colorRgb: '210, 160, 168', icon: 'fa-glass-water', capColor: 'เหลือง' },
    { id: 'strawberry-yogurt', nameTH: 'โยเกิร์ตสตอเบอรี่', nameEN: 'Strawberry Yogurt', category: 'yogurt', color: '#D48A92', colorRgb: '212, 138, 146', icon: 'fa-ice-cream', capColor: 'ชมพู' },
    { id: 'strawberry', nameTH: 'สตอเบอรี่', nameEN: 'Strawberry', category: 'fruit', color: '#D96B6B', colorRgb: '217, 107, 107', icon: 'fa-heart', capColor: 'ฟ้า' },
    { id: 'apple', nameTH: 'แอปเปิ้ล', nameEN: 'Apple', category: 'fruit', color: '#CE7B7B', colorRgb: '206, 123, 123', icon: 'fa-apple-whole', capColor: 'เหลือง' },
    { id: 'greentea', nameTH: 'ชาเขียว', nameEN: 'Green Tea', category: 'tea', color: '#7CA682', colorRgb: '124, 166, 130', icon: 'fa-leaf', capColor: 'แดง' },
    { id: 'taro', nameTH: 'เผือก', nameEN: 'Taro', category: 'yogurt', color: '#B0A2C7', colorRgb: '176, 162, 199', icon: 'fa-cube', capColor: 'ม่วง' },
    { id: 'cocoa', nameTH: 'โกโก้', nameEN: 'Cocoa', category: 'cocoa', color: '#9C7C60', colorRgb: '156, 124, 96', icon: 'fa-mug-hot', capColor: 'แดง' },
    { id: 'watermelon', nameTH: 'แตงโม', nameEN: 'Watermelon', category: 'fruit', color: '#DF8A8E', colorRgb: '223, 138, 142', icon: 'fa-glass-water', capColor: 'ดำ' }
];

const PRICE_PER_BOTTLE = 80;

const CAP_COLORS_MAP = {
    'ดำ': '#000000',
    'แดง': '#ef4444',
    'ม่วง': '#a855f7',
    'เหลือง': '#facc15',
    'ขาว': '#ffffff',
    'ฟ้า': '#38bdf8',
    'น้ำเงิน': '#2563eb',
    'ชมพู': '#ec4899'
};

const DEFAULT_USERS = [
    { username: 'admin', pin: '5678', role: 'admin' },
    { username: 'พนักงาน', pin: '1234', role: 'staff' }
];

// HELPER TO GET DRINK AND BATCH INFORMATION
function getDrinkById(drinkId) {
    if (!drinkId) return null;
    const baseId = drinkId.replace(/_(old|new)$/, '');
    return DRINKS.find(d => d.id === baseId);
}

function getBatchSuffix(drinkId) {
    if (!drinkId) return '';
    if (drinkId.endsWith('_old')) return ' (เก่า)';
    if (drinkId.endsWith('_new')) return ' (ใหม่)';
    return '';
}

function normalizeLegacyStateData(targetState) {
    if (!targetState) return false;
    if (!targetState.stock || typeof targetState.stock !== 'object') targetState.stock = {};
    if (!targetState.stockDates || typeof targetState.stockDates !== 'object') targetState.stockDates = {};

    let modified = false;

    DRINKS.forEach(drink => {
        const legacyKey = drink.id;
        const oldKey = `${drink.id}_old`;
        const newKey = `${drink.id}_new`;

        if (targetState.stock[legacyKey] !== undefined && targetState.stock[oldKey] === undefined) {
            targetState.stock[oldKey] = targetState.stock[legacyKey];
            targetState.stock[newKey] = targetState.stock[newKey] || 0;
            delete targetState.stock[legacyKey];
            modified = true;
        }

        if (targetState.stock[oldKey] === undefined) {
            targetState.stock[oldKey] = 20;
            modified = true;
        }
        if (targetState.stock[newKey] === undefined) {
            targetState.stock[newKey] = 0;
            modified = true;
        }

        if (targetState.stockDates[oldKey] === undefined) {
            targetState.stockDates[oldKey] = '';
            modified = true;
        }
        if (targetState.stockDates[newKey] === undefined) {
            targetState.stockDates[newKey] = '';
            modified = true;
        }
    });

    function migrateItemsArray(itemsArray) {
        if (!Array.isArray(itemsArray)) return false;
        let migratedAny = false;

        itemsArray.forEach(item => {
            if (!item || typeof item !== 'object' || !item.items) return;
            const migratedItems = {};
            let neededMigration = false;

            for (const key in item.items) {
                if (!key.endsWith('_old') && !key.endsWith('_new')) {
                    const drink = DRINKS.find(d => d.id === key);
                    if (drink) {
                        migratedItems[`${key}_old`] = item.items[key];
                        neededMigration = true;
                        continue;
                    }
                }
                migratedItems[key] = item.items[key];
            }

            if (neededMigration) {
                item.items = migratedItems;
                migratedAny = true;
            }
        });

        return migratedAny;
    }

    if (migrateItemsArray(targetState.orders)) {
        modified = true;
    }
    if (migrateItemsArray(targetState.grabPickups)) {
        modified = true;
    }

    return modified;
}

function getSelectedBatch(drinkId) {
    if (!state.selectedBatch) state.selectedBatch = {};
    const oldQty = getAvailableStock(drinkId + '_old');
    const newQty = getAvailableStock(drinkId + '_new');
    
    if (!state.selectedBatch[drinkId]) {
        state.selectedBatch[drinkId] = (oldQty > 0) ? 'old' : 'new';
    } else if (state.selectedBatch[drinkId] === 'old' && oldQty === 0 && newQty > 0) {
        state.selectedBatch[drinkId] = 'new';
    } else if (state.selectedBatch[drinkId] === 'new' && newQty === 0 && oldQty > 0) {
        state.selectedBatch[drinkId] = 'old';
    }
    return state.selectedBatch[drinkId];
}
// STATE MANAGEMENT
let state = {
    orders: [],
    grabPickups: [],
    editingOrderId: null,
    cart: {}, // drinkId_batch -> quantity
    selectedBatch: {}, // drinkId -> 'old' | 'new'
    stockDates: {}, // drinkId_batch -> 'YYYY-MM-DD'
    searchQuery: '',
    tab: 'tables-tab',
    supabaseUrl: '',
    supabaseKey: '',
    autoSync: false,
    stock: {}, // drinkId_batch -> quantity
    users: []
};

// SUPABASE CLIENT & REALTIME SYNC VARIABLES
let supabaseClient = null;
let supabaseSubscription = null;

// LOAD INITIAL STATE FROM LOCAL STORAGE
function init() {
    // Initialize users list
    const savedUsers = localStorage.getItem('juice_bar_users');
    if (savedUsers) {
        try {
            state.users = JSON.parse(savedUsers);
            if (!Array.isArray(state.users) || state.users.length === 0) {
                state.users = [...DEFAULT_USERS];
                localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
            } else {
                // Migrate: Ensure all users have a role, and 'admin' is always admin
                let migrated = false;
                try {
                    state.users = state.users
                        .filter(u => u && typeof u === 'object' && u.username)
                        .map(u => {
                            let updatedUser = { ...u };
                            const usernameLower = (updatedUser.username || '').toLowerCase();
                            if (!updatedUser.role) {
                                updatedUser.role = (usernameLower === 'admin') ? 'admin' : 'staff';
                                migrated = true;
                            }
                            if (usernameLower === 'admin' && updatedUser.role !== 'admin') {
                                updatedUser.role = 'admin';
                                migrated = true;
                            }
                            return updatedUser;
                        });
                    if (migrated) {
                        localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
                    }
                } catch (migrationErr) {
                    console.error("Migration error", migrationErr);
                    state.users = [...DEFAULT_USERS];
                    localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
                }
            }
        } catch (e) {
            state.users = [...DEFAULT_USERS];
            localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
        }
    } else {
        state.users = [...DEFAULT_USERS];
        localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
    }

    const savedState = localStorage.getItem('juice_bar_tracker_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            state.orders = parsed.orders || [];
            state.grabPickups = parsed.grabPickups || [];
            state.stock = parsed.stock || {};
            state.stockDates = parsed.stockDates || {};
            normalizeLegacyStateData(state);
        } catch (e) {
            console.error("Error parsing saved state", e);
        }
    }
    
    // DEFINE LEGACY DATA MIGRATION FUNCTION
    function migrateLegacyData() {
        let modified = false;

        // 1. Migrate stock keys (e.g. 'oishi' -> 'oishi_old')
        DRINKS.forEach(drink => {
            if (state.stock[drink.id] !== undefined) {
                state.stock[drink.id + '_old'] = state.stock[drink.id];
                state.stock[drink.id + '_new'] = 0;
                delete state.stock[drink.id];
                modified = true;
            }
        });

        // 2. Migrate order item keys
        if (state.orders && Array.isArray(state.orders)) {
            state.orders.forEach(order => {
                if (order.items) {
                    const migratedItems = {};
                    let orderMigrated = false;
                    for (const key in order.items) {
                        if (!key.endsWith('_old') && !key.endsWith('_new')) {
                            const drink = DRINKS.find(d => d.id === key);
                            if (drink) {
                                migratedItems[key + '_old'] = order.items[key];
                                orderMigrated = true;
                            }
                        } else {
                            migratedItems[key] = order.items[key];
                        }
                    }
                    if (orderMigrated) {
                        order.items = migratedItems;
                        modified = true;
                    }
                }
            });
        }

        // 3. Migrate grab pickups items keys
        if (state.grabPickups && Array.isArray(state.grabPickups)) {
            state.grabPickups.forEach(grab => {
                if (grab.items) {
                    const migratedItems = {};
                    let grabMigrated = false;
                    for (const key in grab.items) {
                        if (!key.endsWith('_old') && !key.endsWith('_new')) {
                            const drink = DRINKS.find(d => d.id === key);
                            if (drink) {
                                migratedItems[key + '_old'] = grab.items[key];
                                grabMigrated = true;
                            }
                        } else {
                            migratedItems[key] = grab.items[key];
                        }
                    }
                    if (grabMigrated) {
                        grab.items = migratedItems;
                        modified = true;
                    }
                }
            });
        }

        // 4. Ensure all batch keys are initialized
        DRINKS.forEach(drink => {
            if (state.stock[drink.id + '_old'] === undefined) {
                state.stock[drink.id + '_old'] = 20;
                modified = true;
            }
            if (state.stock[drink.id + '_new'] === undefined) {
                state.stock[drink.id + '_new'] = 0;
                modified = true;
            }
            
            if (!state.stockDates) state.stockDates = {};
            if (state.stockDates[drink.id + '_old'] === undefined) {
                state.stockDates[drink.id + '_old'] = '';
                modified = true;
            }
            if (state.stockDates[drink.id + '_new'] === undefined) {
                state.stockDates[drink.id + '_new'] = '';
                modified = true;
            }
        });

        if (modified) {
            console.log("Legacy data successfully migrated to batch-specific keys.");
            saveToLocalStorage(true);
        }
    }

    migrateLegacyData();
    
    // Load Supabase configurations
    state.supabaseUrl = localStorage.getItem('juice_bar_supabase_url') || '';
    state.supabaseKey = localStorage.getItem('juice_bar_supabase_key') || '';
    
    const savedAutoSync = localStorage.getItem('juice_bar_auto_sync');
    state.autoSync = savedAutoSync !== null ? savedAutoSync === 'true' : true;
    
    // Ensure config is stored in localStorage
    localStorage.setItem('juice_bar_supabase_url', state.supabaseUrl);
    localStorage.setItem('juice_bar_supabase_key', state.supabaseKey);
    localStorage.setItem('juice_bar_auto_sync', state.autoSync ? 'true' : 'false');
    
    // Populate Supabase UI inputs & staff name
    document.getElementById('supabase-url-input').value = state.supabaseUrl;
    document.getElementById('supabase-key-input').value = state.supabaseKey;
    document.getElementById('auto-sync-checkbox').checked = state.autoSync;
    document.getElementById('staff-name').value = localStorage.getItem('juice_bar_last_staff') || '';
    
    // Set default dates
    const todayStr = getLocalDateString(new Date());
    document.getElementById('order-date').value = todayStr;
    document.getElementById('filter-custom-date').value = todayStr;
    const summaryCustomDate = document.getElementById('summary-filter-custom-date');
    if (summaryCustomDate) {
        summaryCustomDate.value = todayStr;
    }
    
    // Bind UI elements & Listeners
    setupClock();
    setupEventListeners();
    renderLoginUserDropdown();
    checkLoginStatus();
    renderDrinkGrid();
    renderCart();
    renderTables();
    renderOrders();
    renderGrabLogs();
    renderStock();
    renderAnalytics();
    renderAdminUsersList();
    
    // Initialize Supabase Client & Realtime Sync
    initSupabaseClient();

    // Auto-pull from Supabase on startup if configured
    if (state.supabaseUrl && state.supabaseKey) {
        pullFromSupabase(true);
    }

    // Periodic background sync every 60 seconds (only if autoSync is enabled and credentials exist, and not editing)
    setInterval(() => {
        if (state.supabaseUrl && state.supabaseKey && state.autoSync && !state.editingOrderId) {
            pullFromSupabase(true).catch(err => console.warn("Background sync failed:", err));
        }
    }, 60000);
}

// CHECK LOGIN STATUS
// CHECK LOGIN STATUS
function checkLoginStatus() {
    const loggedIn = sessionStorage.getItem('baanphuan_logged_in') === 'true';
    const loginContainer = document.getElementById('login-container');
    const adminTabBtn = document.getElementById('tab-btn-admin');
    const appContainer = document.getElementById('app-container');
    
    if (loggedIn) {
        if (loginContainer) loginContainer.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        
        const username = sessionStorage.getItem('baanphuan_username') || 'พนักงาน';
        
        // Lookup user in state.users to get the most up-to-date role and prevent session cache issues
        const foundUser = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        const role = foundUser ? foundUser.role : (sessionStorage.getItem('baanphuan_role') || 'staff');
        sessionStorage.setItem('baanphuan_role', role);
        
        document.getElementById('header-username').innerText = username;
        document.getElementById('header-user-badge').style.display = 'flex';
        document.getElementById('staff-name').value = username;
        if (role === 'admin') {
            if (adminTabBtn) adminTabBtn.style.display = 'flex';
        } else {
            if (adminTabBtn) adminTabBtn.style.display = 'none';
            if (state.tab === 'admin-tab') {
                switchTab('tables-tab');
            }
        }
    } else {
        if (loginContainer) loginContainer.classList.remove('hidden'); // Show login screen by default
        if (appContainer) appContainer.classList.add('hidden');
        
        document.getElementById('header-user-badge').style.display = 'none';
        if (adminTabBtn) adminTabBtn.style.display = 'none';
        
        // Render customer view inside login container
        renderCustomerView();
        const resultsEl = document.getElementById('customer-search-results');
        if (resultsEl) resultsEl.innerHTML = '<div class="text-center text-muted py-4">พิมพ์ชื่อเล่นหรือเลขโต๊ะของคุณด้านบนเพื่อตรวจสอบรายการค้างดื่ม/ค้างจ่ายเงิน</div>';
        const searchInput = document.getElementById('customer-search-input');
        if (searchInput) searchInput.value = '';
        
        switchTab('tables-tab');
    }
}

// SAVE STATE TO LOCAL STORAGE
function saveToLocalStorage(skipSync = false) {
    localStorage.setItem('juice_bar_tracker_state', JSON.stringify({
        orders: state.orders,
        grabPickups: state.grabPickups,
        stock: state.stock,
        stockDates: state.stockDates
    }));
    
    // Refresh all UI views to keep them in-sync
    renderTables();
    renderOrders();
    renderGrabLogs();
    renderStock();
    renderAnalytics();
    renderDrinkGrid();
    renderPromoTab();
    renderCustomerView();
    
    const searchInput = document.getElementById('customer-search-input');
    if (searchInput && searchInput.value.trim()) {
        searchCustomerStatus();
    }
    
    if (!skipSync && state.autoSync && state.supabaseUrl && state.supabaseKey) {
        pushToSupabase(true);
    }
}

// SAVE USERS TO LOCAL STORAGE
function saveUsersToLocalStorage(skipSync = false) {
    localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
    
    if (!skipSync && state.autoSync && state.supabaseUrl && state.supabaseKey) {
        pushToSupabase(true);
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
function calculateBestPrice(quantity, isGrab = false) {
    if (quantity <= 0) {
        return { total: 0, num7: 0, num4: 0, num1: 0, discount: 0 };
    }
    
    if (isGrab) {
        const grabPrice = 67.90;
        const total = quantity * grabPrice;
        const totalRounded = Math.round(total * 100) / 100;
        return {
            total: totalRounded,
            num7: 0,
            num4: 0,
            num1: quantity,
            discount: 0
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

// GET HUMAN READABLE PROMOTION DESCRIPTION
function getPromotionDescription(pricing, isGrab = false) {
    if (isGrab) return "Grab Delivery";
    
    const num7 = pricing.num7 || 0;
    const num4 = pricing.num4 || 0;
    const num1 = pricing.num1 || 0;
    
    let parts = [];
    if (num7 > 0) {
        parts.push(num7 === 1 ? "โปร 7" : `โปร 7 (x${num7})`);
    }
    if (num4 > 0) {
        parts.push(num4 === 1 ? "โปร 4" : `โปร 4 (x${num4})`);
    }
    if (num1 > 0) {
        parts.push(num1 === 1 ? "1 ขวด" : `${num1} ขวด`);
    }
    
    if (parts.length === 0) return "-";
    
    // If it's only single bottles (1-3 bottles), show "เป็นขวด" instead of just "1 ขวด" or "2 ขวด"
    if (num7 === 0 && num4 === 0) {
        return `เป็นขวด (${num1} ขวด)`;
    }
    
    return parts.join(" และ ");
}

// EVENT LISTENERS BINDING
function setupEventListeners() {
    // Delivery channel switch
    const deliveryTypeSelect = document.getElementById('delivery-type');
    deliveryTypeSelect.addEventListener('change', (e) => {
        const grabGroup = document.getElementById('grab-driver-group');
        if (grabGroup) {
            grabGroup.style.display = e.target.value === 'grab' ? 'block' : 'none';
        }
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

    // Customer Name / Table dropdown change handler
    const customerInput = document.getElementById('customer-name');
    customerInput.addEventListener('change', (e) => {
        const val = e.target.value;
        // Auto-set delivery type from customer name selection
        const deliveryTypeInput = document.getElementById('delivery-type');
        if (val === 'Grab') {
            deliveryTypeInput.value = 'grab';
        } else {
            deliveryTypeInput.value = 'walkin';
        }
        
        // Show Grab driver field if Grab selected
        const grabGroup = document.getElementById('grab-driver-group');
        if (grabGroup) {
            grabGroup.style.display = val === 'Grab' ? 'block' : 'none';
        }
        
        // Re-render cart to update prices instantly
        renderCart();
        
        // Suggest incremental order merge if table has an active order today
        if (val && val !== 'กลับบ้าน' && val !== 'Grab') {
            checkCustomerPreviousOrders(val);
        }

        // Update cancel table button visibility
        updateCancelTableButtonVisibility();
    });

    // Date change handler for POS order date
    const posOrderDateInput = document.getElementById('order-date');
    if (posOrderDateInput) {
        posOrderDateInput.addEventListener('change', () => {
            updateCancelTableButtonVisibility();
            renderTables();
        });
    }

    // Cancel Table button listener
    const cancelTableBtn = document.getElementById('btn-cancel-table');
    if (cancelTableBtn) {
        cancelTableBtn.addEventListener('click', () => {
            const selectedVal = document.getElementById('customer-name').value;
            const activeDate = document.getElementById('order-date').value;
            if (selectedVal && selectedVal.startsWith('โต๊ะ ')) {
                const activeOrder = state.orders.find(o => 
                    (o.customerName === selectedVal || o.customerName.startsWith(selectedVal + ' (')) && 
                    o.date === activeDate && !o.tableClosed
                );
                if (activeOrder) {
                    deleteOrder(activeOrder.id);
                } else {
                    alert(`ไม่พบออเดอร์ค้างชำระ/กำลังใช้งานของ "${selectedVal}" ในวันที่เลือก`);
                }
            }
        });
    }

    // Clear POS Form button
    const clearFormBtn = document.getElementById('btn-clear-form');
    clearFormBtn.addEventListener('click', () => {
        clearPOSForm();
    });
    clearFormBtn.addEventListener('touchstart', () => {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }, { passive: true });

    // Save Order button
    const saveOrderBtn = document.getElementById('btn-save-order');
    saveOrderBtn.addEventListener('click', () => {
        saveOrder();
    });
    saveOrderBtn.addEventListener('touchstart', () => {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
    }, { passive: true });

    // Tab buttons switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
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

    document.getElementById('filter-payment-status').addEventListener('change', () => {
        renderOrders();
    });

    document.getElementById('search-order-customer').addEventListener('input', () => {
        renderOrders();
    });

    // Grab logs search (safeguarded - element removed with grab tab)
    const searchGrabRiderInput = document.getElementById('search-grab-rider');
    if (searchGrabRiderInput) {
        searchGrabRiderInput.addEventListener('input', () => {
            renderGrabLogs();
        });
    }

    // Backup & Restore buttons
    document.getElementById('btn-backup').addEventListener('click', () => {
        document.getElementById('backup-modal').classList.add('active');
    });

    document.getElementById('btn-close-backup-modal').addEventListener('click', () => {
        document.getElementById('backup-modal').classList.remove('active');
    });

    // Payment Modal close
    const closePayModal = document.getElementById('btn-close-pay-modal');
    if (closePayModal) {
        closePayModal.addEventListener('click', () => {
            document.getElementById('pay-modal').classList.remove('active');
        });
    }

    document.getElementById('btn-export-data').addEventListener('click', exportData);
    
    document.getElementById('btn-trigger-import').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', importData);

    document.getElementById('btn-clear-all-data').addEventListener('click', clearAllSystemData);

    // Supabase Sync Event Listeners
    document.getElementById('supabase-url-input').addEventListener('input', (e) => {
        state.supabaseUrl = e.target.value.trim();
        localStorage.setItem('juice_bar_supabase_url', state.supabaseUrl);
        initSupabaseClient();
    });

    document.getElementById('supabase-key-input').addEventListener('input', (e) => {
        state.supabaseKey = e.target.value.trim();
        localStorage.setItem('juice_bar_supabase_key', state.supabaseKey);
        initSupabaseClient();
    });

    document.getElementById('auto-sync-checkbox').addEventListener('change', (e) => {
        state.autoSync = e.target.checked;
        localStorage.setItem('juice_bar_auto_sync', state.autoSync ? 'true' : 'false');
    });

    document.getElementById('btn-pull-sheet').addEventListener('click', () => pullFromSupabase(false));
    document.getElementById('btn-push-sheet').addEventListener('click', () => pushToSupabase(false));

    // Summary/Analytics Date Filters
    const summaryFilterDate = document.getElementById('summary-filter-date');
    if (summaryFilterDate) {
        summaryFilterDate.addEventListener('change', (e) => {
            const val = e.target.value;
            const customGroup = document.getElementById('summary-custom-date-group');
            if (customGroup) {
                customGroup.style.display = val === 'custom' ? 'block' : 'none';
            }
            renderAnalytics();
        });
    }

    const summaryFilterCustomDate = document.getElementById('summary-filter-custom-date');
    if (summaryFilterCustomDate) {
        summaryFilterCustomDate.addEventListener('change', () => {
            renderAnalytics();
        });
    }

    const btnCopySummary = document.getElementById('btn-copy-summary');
    if (btnCopySummary) {
        btnCopySummary.addEventListener('click', copyDailySummaryToText);
    }

    // Grab Manual Log Modal (safeguarded/disabled since tab is removed)
    const btnAddGrab = document.getElementById('btn-add-grab-manual');
    if (btnAddGrab) btnAddGrab.addEventListener('click', openGrabManualModal);
    const btnCloseGrab = document.getElementById('btn-close-grab-modal');
    if (btnCloseGrab) btnCloseGrab.addEventListener('click', closeGrabManualModal);
    const btnCancelGrab = document.getElementById('btn-cancel-grab-modal');
    if (btnCancelGrab) btnCancelGrab.addEventListener('click', closeGrabManualModal);
    const grabManualForm = document.getElementById('grab-manual-form');
    if (grabManualForm) grabManualForm.addEventListener('submit', handleGrabManualSubmit);

    // Login Screen Event Listeners
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitLogin();
        });
    }

    const btnLoginPullSheet = document.getElementById('btn-login-pull-sheet');
    if (btnLoginPullSheet) {
        btnLoginPullSheet.addEventListener('click', async () => {
            if (!state.supabaseUrl || !state.supabaseKey) {
                let url = state.supabaseUrl || '';
                const newUrl = prompt("ระบุ Supabase Project URL (เช่น https://xxxx.supabase.co):", url);
                if (newUrl === null) return; // User cancelled
                
                let key = state.supabaseKey || '';
                const newKey = prompt("ระบุ Supabase Anon Key:", key);
                if (newKey === null) return; // User cancelled
                
                const trimmedUrl = newUrl.trim();
                const trimmedKey = newKey.trim();
                if (!trimmedUrl || !trimmedKey) {
                    alert("กรุณาระบุข้อมูลที่ถูกต้อง");
                    return;
                }
                
                state.supabaseUrl = trimmedUrl;
                state.supabaseKey = trimmedKey;
                localStorage.setItem('juice_bar_supabase_url', state.supabaseUrl);
                localStorage.setItem('juice_bar_supabase_key', state.supabaseKey);
                initSupabaseClient();
            }
            
            const originalText = btnLoginPullSheet.innerHTML;
            btnLoginPullSheet.disabled = true;
            btnLoginPullSheet.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังซิงค์ข้อมูล...';
            
            try {
                await pullFromSupabase(true);
                const userSummary = state.users.map(u => `${u.username} (${u.pin ? u.pin.length : 0} หลัก)`).join(", ");
                alert("ซิงค์ข้อมูลผู้ใช้งานและยอดขายสำเร็จ!\n\nบัญชีพนักงานที่โหลดได้:\n" + userSummary);
            } catch(e) {
                alert("ซิงค์ข้อมูลล้มเหลว: " + e.message);
            } finally {
                btnLoginPullSheet.disabled = false;
                btnLoginPullSheet.innerHTML = originalText;
            }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('baanphuan_logged_in');
            sessionStorage.removeItem('baanphuan_username');
            sessionStorage.removeItem('baanphuan_role');
            checkLoginStatus();
        });
    }

    // Profile Edit Modal toggle and submission
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const headerUsernameSpan = document.getElementById('header-username');
    const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
    const btnCancelProfileSave = document.getElementById('btn-cancel-profile-save');
    const profileModal = document.getElementById('profile-modal');
    const profileForm = document.getElementById('profile-edit-form');

    const openProfileModal = () => {
        const username = sessionStorage.getItem('baanphuan_username');
        if (!username) return;
        const foundUser = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!foundUser) return;

        document.getElementById('profile-username').value = foundUser.username;
        document.getElementById('profile-pin').value = foundUser.pin;
        profileModal.classList.add('active');
    };

    const closeProfileModal = () => {
        profileModal.classList.remove('active');
    };

    if (btnEditProfile) btnEditProfile.addEventListener('click', openProfileModal);
    if (headerUsernameSpan) headerUsernameSpan.addEventListener('click', openProfileModal);
    if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeProfileModal);
    if (btnCancelProfileSave) btnCancelProfileSave.addEventListener('click', closeProfileModal);

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('profile-username').value.trim();
            const newPin = document.getElementById('profile-pin').value.trim();
            const oldUsername = sessionStorage.getItem('baanphuan_username');

            if (newPin.length < 4 || newPin.length > 6 || isNaN(newPin)) {
                alert('รหัสผ่าน PIN ต้องเป็นตัวเลข 4-6 หลักเท่านั้น');
                return;
            }

            // Check duplicate name (excluding self)
            if (newUsername.toLowerCase() !== oldUsername.toLowerCase()) {
                if (state.users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
                    alert('มีชื่อพนักงานคนนี้อยู่ในระบบแล้ว');
                    return;
                }
            }

            // Update user in state
            const userIndex = state.users.findIndex(u => u.username.toLowerCase() === oldUsername.toLowerCase());
            if (userIndex !== -1) {
                const currentRole = state.users[userIndex].role;
                state.users[userIndex] = { username: newUsername, pin: newPin, role: currentRole };
                
                // Save to localStorage
                saveUsersToLocalStorage();
                
                // Update session storage
                sessionStorage.setItem('baanphuan_username', newUsername);
                
                // Update last staff logging reference
                const lastStaff = localStorage.getItem('juice_bar_last_staff');
                if (lastStaff === oldUsername) {
                    localStorage.setItem('juice_bar_last_staff', newUsername);
                }

                // Re-render dropdown & lists
                renderLoginUserDropdown();
                renderAdminUsersList();
                checkLoginStatus();
                closeProfileModal();
                alert('บันทึกข้อมูลส่วนตัวสำเร็จ');
            } else {
                alert('ไม่พบผู้ใช้นี้ในระบบ');
            }
        });
    }

    // Admin Panel - Add/Edit User Form
    const adminUserForm = document.getElementById('admin-user-form');
    if (adminUserForm) {
        adminUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('admin-username');
            const pinInput = document.getElementById('admin-pin');
            const roleSelect = document.getElementById('admin-role');
            const originalUsernameInput = document.getElementById('admin-edit-original-username');
            
            const username = usernameInput.value.trim();
            const pin = pinInput.value.trim();
            const role = roleSelect.value;
            const originalUsername = originalUsernameInput.value;
            
            if (pin.length < 4 || pin.length > 6 || isNaN(pin)) {
                alert('รหัสผ่าน PIN ต้องเป็นตัวเลข 4-6 หลักเท่านั้น');
                return;
            }
            
            if (originalUsername) {
                // Editing existing user
                const userIndex = state.users.findIndex(u => u.username.toLowerCase() === originalUsername.toLowerCase());
                if (userIndex !== -1) {
                    state.users[userIndex] = { username, pin, role };
                }
                originalUsernameInput.value = '';
                document.getElementById('btn-admin-cancel-edit').style.display = 'none';
            } else {
                // Adding new user
                if (state.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                    alert('มีชื่อพนักงานคนนี้อยู่ในระบบแล้ว');
                    return;
                }
                state.users.push({ username, pin, role });
            }
            
            // Save to localStorage
            saveUsersToLocalStorage();
            
            // Reset form and re-render
            usernameInput.value = '';
            pinInput.value = '';
            roleSelect.value = 'staff';
            
            renderLoginUserDropdown();
            renderAdminUsersList();
            
            // Update current user info if they edited their own account
            const currentLoggedIn = sessionStorage.getItem('baanphuan_username');
            if (originalUsername && currentLoggedIn && originalUsername.toLowerCase() === currentLoggedIn.toLowerCase()) {
                sessionStorage.setItem('baanphuan_username', username);
                sessionStorage.setItem('baanphuan_role', role);
                checkLoginStatus();
            }
            
            alert('บันทึกข้อมูลสำเร็จ');
        });
    }

    const btnAdminCancelEdit = document.getElementById('btn-admin-cancel-edit');
    if (btnAdminCancelEdit) {
        btnAdminCancelEdit.addEventListener('click', () => {
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-pin').value = '';
            document.getElementById('admin-role').value = 'staff';
            document.getElementById('admin-edit-original-username').value = '';
            btnAdminCancelEdit.style.display = 'none';
        });
    }

    // Customer View Event Listeners (inside Admin Customer Tab)

    const btnCustomerSearch = document.getElementById('btn-customer-search');
    if (btnCustomerSearch) {
        btnCustomerSearch.addEventListener('click', searchCustomerStatus);
    }

    const customerSearchInput = document.getElementById('customer-search-input');
    if (customerSearchInput) {
        customerSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchCustomerStatus();
            }
        });
    }

    // Promo Tab Event Listeners
    const filterPromoStatus = document.getElementById('filter-promo-status');
    if (filterPromoStatus) {
        filterPromoStatus.addEventListener('change', renderPromoTab);
    }

    const searchPromoCustomer = document.getElementById('search-promo-customer');
    if (searchPromoCustomer) {
        searchPromoCustomer.addEventListener('input', renderPromoTab);
    }
}

// CHECK IF CUSTOMER HAS EXISTING ORDERS TO SUGGEST APPENDING (Incremental ordering)
function checkCustomerPreviousOrders(custName) {
    const selectedDate = document.getElementById('order-date').value;
    
    // Find active orders for this customer on the selected date
    const userOrders = state.orders.filter(o => {
        // Since customerName might contain the display name like "โต๊ะ 1 (ชื่อลูกค้า)", we match by prefix
        return o.customerName === custName || o.customerName.startsWith(custName + ' (');
    });
    
    if (userOrders.length === 0) {
        if (custName.startsWith('โต๊ะ ')) {
            document.getElementById('order-status').value = 'pending_promo';
        }
        return;
    }
    
    // Sort by date/time (newest first)
    userOrders.sort((a,b) => new Date(b.createdTime) - new Date(a.createdTime));
    const latestOrder = userOrders[0];
    
    // Only suggest merging if the latest order is still unpaid (pending_promo)
    if (latestOrder.status === 'pending_promo' || latestOrder.status === 'unpaid') {
        const itemsCount = Object.values(latestOrder.items).reduce((a, b) => a + b, 0);
        const confirmAppend = confirm(
            `พบออเดอร์ค้างชำระของ "${latestOrder.customerName}" (${itemsCount} ขวด, ${latestOrder.priceDetails.total} บาท)\n\nคุณต้องการ "สั่งสินค้าเพิ่มในบิลเดิม" ใช่หรือไม่?`
        );
        
        if (confirmAppend) {
            loadOrderForEditing(latestOrder.id);
        } else {
            if (custName.startsWith('โต๊ะ ')) {
                document.getElementById('order-status').value = 'pending_promo';
            }
        }
    } else {
        // If the latest order is already paid, a new session is started
        if (custName.startsWith('โต๊ะ ')) {
            document.getElementById('order-status').value = 'pending_promo';
        } else {
            document.getElementById('order-status').value = 'paid';
        }
    }
}

// GET AVAILABLE STOCK (Accounting for order edit session)
function getAvailableStock(drinkId) {
    const defaultQty = drinkId.endsWith('_new') ? 0 : 20;
    const stockQty = state.stock[drinkId] !== undefined ? state.stock[drinkId] : defaultQty;
    
    // If we are currently editing an order, the items in that order should be considered "available" to be re-ordered
    if (state.editingOrderId) {
        const editingOrder = state.orders.find(o => o.id === state.editingOrderId);
        if (editingOrder && editingOrder.items && editingOrder.items[drinkId]) {
            return stockQty + editingOrder.items[drinkId];
        }
    }
    return stockQty;
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
        const qtyInCart = (state.cart[drink.id + '_old'] || 0) + (state.cart[drink.id + '_new'] || 0);
        const activeClass = qtyInCart > 0 ? 'active' : '';
        
        const qtyOld = getAvailableStock(drink.id + '_old');
        const qtyNew = getAvailableStock(drink.id + '_new');
        const dateOld = state.stockDates[drink.id + '_old'] || '';
        const dateNew = state.stockDates[drink.id + '_new'] || '';
        
        const totalAvailable = qtyOld + qtyNew;
        const totalRemaining = Math.max(0, totalAvailable - qtyInCart);
        
        const selectedBatch = getSelectedBatch(drink.id);
        const availableForBatch = getAvailableStock(drink.id + '_' + selectedBatch);
        const inCartForBatch = state.cart[drink.id + '_' + selectedBatch] || 0;
        const remainingForBatch = Math.max(0, availableForBatch - inCartForBatch);
        
        let stockLabel = '';
        let cardStatusClass = '';
        
        if (totalAvailable === 0) {
            stockLabel = `<span class="bev-stock text-danger" style="font-size: 0.75rem; font-weight: bold; display: block; margin-top: 0.15rem;">❌ หมดชั่วคราว</span>`;
            cardStatusClass = 'out-of-stock';
        } else if (totalRemaining === 0) {
            stockLabel = `<span class="bev-stock text-danger" style="font-size: 0.75rem; font-weight: bold; display: block; margin-top: 0.15rem;">❌ เต็มสต็อกแล้ว</span>`;
        } else if (totalAvailable <= 5) {
            stockLabel = `<span class="bev-stock text-warning" style="font-size: 0.75rem; font-weight: bold; display: block; margin-top: 0.15rem;">⚠️ เหลือรวม ${totalAvailable}</span>`;
        } else {
            stockLabel = `<span class="bev-stock text-muted" style="font-size: 0.75rem; display: block; margin-top: 0.15rem;">สต็อกรวม: ${totalAvailable}</span>`;
        }

        const formatDateForDisplay = (dateStr) => {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}`;
            }
            return dateStr;
        };
        
        const labelOld = formatDateForDisplay(dateOld);
        const labelNew = formatDateForDisplay(dateNew);

        const card = document.createElement('div');
        card.className = `bev-card ${activeClass} ${cardStatusClass}`;
        card.setAttribute('style', `--bev-color: ${drink.color}; --bev-color-rgb: ${drink.colorRgb};`);
        
        const batchSelectorHTML = `
            <div class="batch-selector-container" style="display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.5rem; width: 100%;" onclick="event.stopPropagation();">
                <button type="button" class="batch-pill-btn ${selectedBatch === 'old' ? 'selected' : ''} ${qtyOld === 0 ? 'disabled-pill' : ''}" style="--bev-color: ${drink.color}; --bev-color-rgb: ${drink.colorRgb};" ${qtyOld === 0 ? 'disabled' : ''} data-batch="old">
                    <span>ล็อตเก่า ${labelOld ? `(${labelOld})` : ''}</span>
                    <strong>${qtyOld}</strong>
                </button>
                <button type="button" class="batch-pill-btn ${selectedBatch === 'new' ? 'selected' : ''} ${qtyNew === 0 ? 'disabled-pill' : ''}" style="--bev-color: ${drink.color}; --bev-color-rgb: ${drink.colorRgb};" ${qtyNew === 0 ? 'disabled' : ''} data-batch="new">
                    <span>ล็อตใหม่ ${labelNew ? `(${labelNew})` : ''}</span>
                    <strong>${qtyNew}</strong>
                </button>
            </div>
        `;

        card.innerHTML = `
            ${qtyInCart > 0 ? `<span class="badge-qty">${qtyInCart}</span>` : ''}
            <div class="bev-icon"><i class="fa-solid ${drink.icon}"></i></div>
            <div>
                <span class="bev-name-th">${drink.nameTH}</span>
                <span class="bev-name-en">${drink.nameEN}</span>
                <span class="bev-cap-color" style="font-size: 0.7rem; color: var(--color-text-muted); display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; margin-top: 0.2rem; background: rgba(29, 78, 216, 0.05); padding: 0.1rem 0.5rem; border-radius: 50px; border: 1px solid var(--border-glass); user-select: none;">
                    <i class="fa-solid fa-circle" style="color: ${CAP_COLORS_MAP[drink.capColor] || '#ccc'}; font-size: 0.6rem; filter: drop-shadow(0 0 2px ${CAP_COLORS_MAP[drink.capColor] || '#ccc'}); ${drink.capColor === 'ขาว' ? 'border: 1px solid #94a3b8; border-radius: 50%;' : ''}"></i>
                    ฝา${drink.capColor}
                </span>
                ${stockLabel}
                ${batchSelectorHTML}
            </div>
            <div class="bev-controls" style="margin-top: 0.5rem;">
                <button type="button" class="bev-btn minus-btn" title="ลดจำนวน" ${qtyInCart === 0 ? 'disabled' : ''}><i class="fa-solid fa-minus"></i></button>
                <button type="button" class="bev-btn plus-btn" title="เพิ่มจำนวน" ${remainingForBatch === 0 ? 'disabled' : ''}><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
        
        // Handle increment/decrement clicks
        card.querySelector('.plus-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const batch = getSelectedBatch(drink.id);
            changeCartQty(drink.id + '_' + batch, 1);
        });
        
        card.querySelector('.minus-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const batch = getSelectedBatch(drink.id);
            const keyCurrent = drink.id + '_' + batch;
            const keyOther = drink.id + '_' + (batch === 'old' ? 'new' : 'old');
            
            if (state.cart[keyCurrent] > 0) {
                changeCartQty(keyCurrent, -1);
            } else if (state.cart[keyOther] > 0) {
                changeCartQty(keyOther, -1);
            }
        });
        
        // Clicking card anywhere else adds 1 to selected batch
        card.addEventListener('click', () => {
            if (totalAvailable === 0) {
                alert("ขออภัย! สินค้านี้หมดชั่วคราว");
                return;
            }
            const batch = getSelectedBatch(drink.id);
            const cartKey = drink.id + '_' + batch;
            const availableForBatch = getAvailableStock(cartKey);
            const inCartForBatch = state.cart[cartKey] || 0;
            const remainingForBatch = Math.max(0, availableForBatch - inCartForBatch);
            
            if (availableForBatch === 0) {
                alert("ขออภัย! ล็อตนี้หมดแล้ว กรุณาเลือกสลับล็อตในการ์ดด้านบน");
                return;
            }
            if (remainingForBatch === 0) {
                alert("ขออภัย! สินค้าในล็อตนี้ไม่เพียงพอ");
                return;
            }
            changeCartQty(cartKey, 1);
        });

        // Add event listener to batch buttons
        card.querySelectorAll('.batch-pill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const batch = btn.getAttribute('data-batch');
                state.selectedBatch[drink.id] = batch;
                renderDrinkGrid();
            });
        });
        
        grid.appendChild(card);
    });
}

// CHANGE CART QUANTITY
function changeCartQty(cartKey, delta) {
    const currentQty = state.cart[cartKey] || 0;
    const newQty = currentQty + delta;
    
    if (newQty <= 0) {
        delete state.cart[cartKey];
    } else {
        const available = getAvailableStock(cartKey);
        if (newQty > available) {
            alert("ขออภัย! สินค้าในสต็อกไม่เพียงพอ");
            return;
        }
        state.cart[cartKey] = newQty;
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
    
    const isGrab = document.getElementById('delivery-type').value === 'grab';
    const currentPricePerBottle = isGrab ? 67.90 : 80;

    cartKeys.forEach(drinkId => {
        const drink = getDrinkById(drinkId);
        const batchSuffix = getBatchSuffix(drinkId);
        const qty = state.cart[drinkId];
        totalQty += qty;
        
        const cartRow = document.createElement('div');
        cartRow.className = 'cart-item';
        cartRow.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-bullet" style="background-color: ${drink.color};"></div>
                <div>
                    <span class="cart-item-name">${drink.nameTH}${batchSuffix}</span>
                    <span class="bev-name-en">${drink.nameEN} <span style="color: var(--color-primary); font-size: 0.75rem;">(ฝา${drink.capColor})</span></span>
                </div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-qty-control">
                    <button class="cart-qty-btn" onclick="changeCartQty('${drinkId}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <span style="font-weight: 600; font-size: 0.9rem;">${qty}</span>
                    <button class="cart-qty-btn" onclick="changeCartQty('${drinkId}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
                <span class="cart-item-price">${(qty * currentPricePerBottle).toFixed(2)}.-</span>
                <button class="cart-item-delete" onclick="changeCartQty('${drinkId}', -${qty})" title="ลบรายการ"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
        itemsList.appendChild(cartRow);
    });
    
    // Live Calculation
    const pricing = calculateBestPrice(totalQty, isGrab);
    
    totalQtyEl.textContent = `${totalQty} ขวด`;
    calcContainer.style.display = 'flex';
    document.getElementById('calc-subtotal').textContent = `${(totalQty * currentPricePerBottle).toFixed(2)} บาท`;
    
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
    const promoDetailText = getPromotionDescription(pricing, isGrab);
    const calcPromoDetailEl = document.getElementById('calc-promo-detail');
    if (calcPromoDetailEl) {
        calcPromoDetailEl.textContent = promoDetailText;
    }
}

// SAVE ORDER OR UPDATE ORDER
function saveOrder() {
    const saveOrderBtn = document.getElementById('btn-save-order');
    if (saveOrderBtn && saveOrderBtn.disabled) return;

    const tableVal = document.getElementById('customer-name').value.trim();
    const customNameVal = document.getElementById('customer-display-name').value.trim();
    const customerName = customNameVal ? `${tableVal} (${customNameVal})` : tableVal;
    
    // Auto-fill hidden fields if empty
    const staffInput = document.getElementById('staff-name');
    if (!staffInput.value) staffInput.value = sessionStorage.getItem('baanphuan_username') || '';
    const dateInput = document.getElementById('order-date');
    if (!dateInput.value) dateInput.value = getLocalDateString(new Date());
    
    const orderDate = document.getElementById('order-date').value;
    const deliveryType = document.getElementById('delivery-type').value;
    const grabDriverName = deliveryType === 'grab' ? document.getElementById('grab-driver-name').value.trim() : '';
    const status = document.getElementById('order-status').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const staffName = document.getElementById('staff-name').value.trim();
    const orderRemark = document.getElementById('order-remark').value.trim();
    
    if (!customerName) {
        alert("กรุณาเลือกโต๊ะ / ช่องทาง");
        document.getElementById('customer-name').focus();
        return;
    }
    
    const cartKeys = Object.keys(state.cart);
    if (cartKeys.length === 0) {
        alert("กรุณาเลือกเครื่องดื่มอย่างน้อย 1 ขวด");
        return;
    }

    // Disable button to prevent double-clicks
    let originalBtnHtml = '';
    if (saveOrderBtn) {
        saveOrderBtn.disabled = true;
        originalBtnHtml = saveOrderBtn.innerHTML;
        saveOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    }
    
    try {
        // Save last used staff name to remember it
        if (staffName) {
            localStorage.setItem('juice_bar_last_staff', staffName);
        }
        
        const totalQty = Object.values(state.cart).reduce((a, b) => a + b, 0);
        // Grab pricing is 67.90 per bottle, normal is 80 per bottle
        const pricing = calculateBestPrice(totalQty, deliveryType === 'grab');
        
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${hours}:${minutes}`;
        
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
                    priceDetails: pricing,
                    status: status,
                    paymentMethod: paymentMethod,
                    promotionDetail: getPromotionDescription(pricing, deliveryType === 'grab'),
                    staffName: staffName,
                    remark: orderRemark,
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
                priceDetails: pricing,
                status: status,
                paymentMethod: paymentMethod,
                promotionDetail: getPromotionDescription(pricing, deliveryType === 'grab'),
                staffName: staffName,
                remark: orderRemark,
                tableClosed: false,
                previouslyPaid: status === 'paid' ? pricing.total : 0,
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
        renderTables();
        renderOrders();
        renderGrabLogs();
        renderAnalytics();
    } catch (err) {
        console.error("Error saving order:", err);
        alert("เกิดข้อผิดพลาดในการบันทึกออเดอร์: " + err.message);
        if (saveOrderBtn) {
            saveOrderBtn.innerHTML = originalBtnHtml;
        }
    } finally {
        if (saveOrderBtn) {
            saveOrderBtn.disabled = false;
        }
    }
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
    
    let tableName = order.customerName || '';
    let nickName = '';
    const match = tableName.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
        tableName = match[1];
        nickName = match[2];
    }
    
    // Fill inputs
    document.getElementById('customer-name').value = tableName;
    document.getElementById('customer-display-name').value = nickName;
    document.getElementById('order-date').value = order.date;
    document.getElementById('delivery-type').value = order.deliveryType;
    const grabGroup = document.getElementById('grab-driver-group');
    if (grabGroup) {
        grabGroup.style.display = order.deliveryType === 'grab' ? 'block' : 'none';
    }
    document.getElementById('grab-driver-name').value = order.grabDriverName || '';
    document.getElementById('order-status').value = order.status || 'paid';
    document.getElementById('payment-method').value = order.paymentMethod || 'scan';
    document.getElementById('staff-name').value = order.staffName || '';
    document.getElementById('order-remark').value = order.remark || '';
    
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
    document.getElementById('customer-display-name').value = '';
    document.getElementById('order-date').value = getLocalDateString(new Date());
    document.getElementById('delivery-type').value = 'walkin';
    const grabGroup = document.getElementById('grab-driver-group');
    if (grabGroup) {
        grabGroup.style.display = 'none';
    }
    document.getElementById('grab-driver-name').value = '';
    document.getElementById('order-status').value = 'paid';
    document.getElementById('payment-method').value = 'scan';
    document.getElementById('staff-name').value = localStorage.getItem('juice_bar_last_staff') || '';
    document.getElementById('order-remark').value = '';
    
    // UI reset
    document.getElementById('pos-title').innerHTML = `<i class="fa-solid fa-cart-plus text-primary"></i> สั่งน้ำขวด / บันทึกการขาย`;
    document.getElementById('edit-indicator').style.display = 'none';
    document.getElementById('btn-save-order').innerHTML = `<i class="fa-solid fa-check"></i> บันทึกออเดอร์`;
    document.getElementById('btn-clear-form').innerHTML = `<i class="fa-solid fa-eraser"></i> ล้างฟอร์ม`;
    
    renderDrinkGrid();
    renderCart();
    updateCancelTableButtonVisibility();
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
        
        // 2. Payment Status Filter
        const filterPaymentVal = document.getElementById('filter-payment-status').value;
        if (filterPaymentVal !== 'all') {
            const orderStatus = order.status || 'paid';
            if (filterPaymentVal !== orderStatus) return false;
        }
        
        // 3. Name Search
        if (searchCust && !order.customerName.toLowerCase().includes(searchCust)) return false;
        
        return true;
    });
    
    // Sort orders: Newest first
    filteredOrders.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    
    // Update Stats counters for filtered set
    let totalQty = 0;
    let totalRevenue = 0;
    
    filteredOrders.forEach(o => {
        if (o.status === 'pending_promo' || o.status === 'unpaid') return;
        const orderQty = o.items ? Object.values(o.items).reduce((sum, q) => sum + q, 0) : 0;
        totalQty += orderQty;
        const pricing = o.priceDetails || { total: 0, discount: 0 };
        totalRevenue += pricing.total || 0;
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
            channelBadge = `<span class="badge badge-warning"><i class="fa-solid fa-helmet-safety"></i> Grab Delivery</span>`;
        } else if (order.deliveryType === 'walkin') {
            channelBadge = `<span class="badge badge-success"><i class="fa-solid fa-user-check"></i> รับเอง/หน้าร้าน</span>`;
        } else {
            channelBadge = `<span class="badge badge-outline"><i class="fa-solid fa-paper-plane"></i> อื่นๆ</span>`;
        }

        // Status Badge
        let statusBadge = '';
        if (order.status === 'pending_promo') {
            statusBadge = `<span class="badge" style="background-color: #ef4444; color: white;"><i class="fa-solid fa-hourglass-half"></i> ยังไม่ครบโปร</span>`;
        } else if (order.status === 'unpaid') {
            statusBadge = `<span class="badge" style="background-color: #f43f5e; color: white;"><i class="fa-solid fa-circle-xmark"></i> ยังไม่จ่าย</span>`;
        } else {
            statusBadge = `<span class="badge" style="background-color: #22c55e; color: white;"><i class="fa-solid fa-circle-check"></i> ครบโปร / จ่ายแล้ว</span>`;
        }
        
        // Payment Badge
        let paymentBadge = '';
        if (order.paymentMethod === 'cash') {
            paymentBadge = `<span class="badge" style="background-color: #0ea5e9; color: white;"><i class="fa-solid fa-money-bill-wave"></i> เงินสด</span>`;
        } else if (order.paymentMethod === 'scan') {
            paymentBadge = `<span class="badge" style="background-color: #6366f1; color: white;"><i class="fa-solid fa-qrcode"></i> โอน/สแกน</span>`;
        } else if (order.paymentMethod === 'unpaid') {
            paymentBadge = `<span class="badge" style="background-color: #ef4444; color: white;"><i class="fa-solid fa-circle-xmark"></i> ยังไม่จ่าย</span>`;
        } else {
            paymentBadge = `<span class="badge badge-outline" style="border-color: #94a3b8; color: #64748b;"><i class="fa-solid fa-qrcode"></i> โอน/สแกน</span>`;
        }
        
        // Promotion Detail Badge
        let promoBadge = '';
        if (order.promotionDetail) {
            promoBadge = `<span class="badge" style="background-color: #f59e0b; color: white;"><i class="fa-solid fa-gift"></i> ${order.promotionDetail}</span>`;
        } else {
            const oldPricing = order.priceDetails || { num7: 0, num4: 0, num1: 0 };
            const oldDetail = getPromotionDescription(oldPricing, order.deliveryType === 'grab');
            promoBadge = `<span class="badge" style="background-color: #f59e0b; color: white;"><i class="fa-solid fa-gift"></i> ${oldDetail}</span>`;
        }
        
        // Generate drink badges
        let drinkBadgesHTML = '';
        Object.keys(order.items).forEach(drinkId => {
            const drink = getDrinkById(drinkId);
            if (drink) {
                const batchSuffix = getBatchSuffix(drinkId);
                drinkBadgesHTML += `
                    <div class="order-item-badge" style="--bev-color: ${drink.color};" title="ฝาสี${drink.capColor}">
                        <span>${drink.nameTH}${batchSuffix} <span style="font-size: 0.7rem; opacity: 0.75; font-weight: normal;">(${drink.capColor})</span></span>
                        <span class="order-item-qty">x${order.items[drinkId]}</span>
                    </div>
                `;
            }
        });
        
        const staffBadge = order.staffName ? `<span class="badge badge-outline"><i class="fa-solid fa-user-pen"></i> ผู้บันทึก: ${order.staffName}</span>` : '';
        const remarkHTML = order.remark ? `
            <div class="order-remark-text" style="font-size: 0.8rem; color: var(--color-primary); margin-top: 0.5rem; font-style: italic; background: rgba(29, 78, 216, 0.05); padding: 0.35rem 0.5rem; border-radius: 4px; border-left: 2px solid var(--color-primary); display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-regular fa-comment-dots"></i> หมายเหตุ: ${order.remark}
            </div>
        ` : '';

        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <h4 class="order-cust-name">${order.customerName}</h4>
                    <div style="margin-top: 0.25rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${channelBadge}
                        ${statusBadge}
                        ${paymentBadge}
                        ${promoBadge}
                        ${staffBadge}
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
            ${remarkHTML}
            <div class="order-card-footer">
                <div class="order-price-info">
                    <span class="order-total-price text-primary">${(order.priceDetails ? order.priceDetails.total : 0)} บาท</span>
                    ${(order.priceDetails && order.priceDetails.discount > 0) ? `<span class="order-promo-saving"><i class="fa-solid fa-tags"></i> ประหยัดไป ${order.priceDetails.discount} บ.</span>` : ''}
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="toggleOrderStatus('${order.id}')" title="เปลี่ยนสถานะบิล">
                        <i class="fa-solid fa-arrows-spin"></i> ${(order.status === 'pending_promo' || order.status === 'unpaid') ? 'ทำเป็นจ่ายแล้ว' : 'ทำเป็นยังไม่จ่าย'}
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="copyOrderToText('${order.id}')" title="คัดลอกข้อความบิล">
                        <i class="fa-solid fa-copy"></i> คัดลอกบิล
                    </button>
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
        renderTables();
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
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    const searchGrabRider = document.getElementById('search-grab-rider');
    const searchVal = searchGrabRider ? searchGrabRider.value.trim().toLowerCase() : '';
    
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
            const drink = getDrinkById(drinkId);
            if (drink) {
                const batchSuffix = getBatchSuffix(drinkId);
                itemPillsHTML += `
                    <span class="grab-item-pill" style="border-left: 3px solid ${drink.color};">
                        ${drink.nameTH}${batchSuffix} x${g.items[drinkId]}
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
        const drink = getDrinkById(drinkId);
        if (drink) {
            const batchSuffix = getBatchSuffix(drinkId);
            const qty = grab.items[drinkId];
            totalQty += qty;
            itemsHTML += `<tr><td style="padding:5px 0;">${drink.nameTH}${batchSuffix} (${drink.nameEN})</td><td style="text-align:right;">${qty} ขวด</td></tr>`;
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
                <input type="number" class="modal-drink-input" id="modal-qty-${drink.id}" value="0" min="0" style="width: 40px; text-align: center; border: none; background: transparent; color: var(--color-text); font-weight: bold;" readonly>
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
    
    // Deduct items from stock (splitting between old and new batches)
    let itemsWithBatch = {};
    for (const baseDrinkId in items) {
        let qtyToDeduct = items[baseDrinkId];
        
        const oldKey = baseDrinkId + '_old';
        const newKey = baseDrinkId + '_new';
        
        const qtyOld = state.stock[oldKey] !== undefined ? state.stock[oldKey] : 20;
        const qtyNew = state.stock[newKey] !== undefined ? state.stock[newKey] : 0;
        
        // Deduct from old batch first
        if (qtyOld > 0) {
            const deductOld = Math.min(qtyOld, qtyToDeduct);
            state.stock[oldKey] = qtyOld - deductOld;
            itemsWithBatch[oldKey] = deductOld;
            qtyToDeduct -= deductOld;
        }
        
        // If there's still quantity to deduct, deduct from new batch
        if (qtyToDeduct > 0) {
            const deductNew = Math.min(qtyNew, qtyToDeduct);
            state.stock[newKey] = Math.max(0, qtyNew - deductNew);
            itemsWithBatch[newKey] = (itemsWithBatch[newKey] || 0) + deductNew;
            qtyToDeduct -= deductNew;
            
            // If still remaining (insufficient stock overall), log the remainder as new batch
            if (qtyToDeduct > 0) {
                itemsWithBatch[newKey] = (itemsWithBatch[newKey] || 0) + qtyToDeduct;
                state.stock[newKey] = 0;
            }
        }
    }

    const record = {
        id: 'grab-' + Date.now(),
        driverName: driverName,
        customerName: customerName,
        orderId: null, // manual log has no orderId linked
        items: itemsWithBatch,
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
    
    let yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);
    
    // Get filter settings
    const summaryFilterDate = document.getElementById('summary-filter-date');
    const filterVal = summaryFilterDate ? summaryFilterDate.value : 'today';
    const summaryFilterCustomDate = document.getElementById('summary-filter-custom-date');
    const customDateVal = summaryFilterCustomDate ? summaryFilterCustomDate.value : todayStr;
    
    let targetDateText = 'ยอดขายวันนี้';
    if (filterVal === 'yesterday') {
        targetDateText = 'ยอดขายเมื่อวาน';
    } else if (filterVal === 'custom') {
        const dObj = new Date(customDateVal);
        const formatThai = isNaN(dObj.getTime()) ? customDateVal : dObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        targetDateText = `ยอดขายวันที่ ${formatThai}`;
    } else if (filterVal === 'all') {
        targetDateText = 'ยอดขายทั้งหมด (ทุกวัน)';
    }
    
    const titleEl = document.getElementById('analytics-date-title');
    if (titleEl) {
        titleEl.textContent = targetDateText;
    }
    
    // 1. CALCULATE REVENUE/BOTTLES
    let filteredRevenue = 0;
    let filteredBottles = 0;
    let filteredDiscount = 0;
    let filteredCommBottles = 0;
    let filteredScanRevenue = 0;
    let filteredCashRevenue = 0;
    let filteredUnpaidRevenue = 0;
    
    let totalRevenue = 0;
    let totalBottles = 0;
    let totalDiscount = 0;
    let totalCommBottles = 0;

    const loggedInUsername = sessionStorage.getItem('baanphuan_username') || '';
    const loggedInUser = state.users.find(u => u.username.toLowerCase() === loggedInUsername.toLowerCase());
    const isLoggedInStaff = loggedInUser && loggedInUser.role === 'staff';
    
    // Popularity tracker (drinkId -> count)
    let popTracker = {};
    DRINKS.forEach(d => popTracker[d.id] = 0);
    
    // Delivery stats
    let deliveryStats = { walkin: 0, grab: 0, other: 0 };
    
    state.orders.forEach(order => {
        if (order.status === 'pending_promo' || order.status === 'unpaid') return;
        const orderQty = order.items ? Object.values(order.items).reduce((a, b) => a + b, 0) : 0;
        const pricing = order.priceDetails || { total: 0, discount: 0 };
        const matchesStaff = isLoggedInStaff ? (order.staffName && order.staffName.toLowerCase() === loggedInUsername.toLowerCase()) : false;
        
        // Sum grand totals (always all-time)
        totalBottles += orderQty;
        totalRevenue += pricing.total || 0;
        totalDiscount += pricing.discount || 0;
        if (order.deliveryType !== 'grab' && matchesStaff) {
            totalCommBottles += orderQty;
        }
        
        // Check if order matches date filter
        let matchesFilter = false;
        if (filterVal === 'today' && order.date === todayStr) matchesFilter = true;
        else if (filterVal === 'yesterday' && order.date === yesterdayStr) matchesFilter = true;
        else if (filterVal === 'custom' && order.date === customDateVal) matchesFilter = true;
        else if (filterVal === 'all') matchesFilter = true;
        
        if (matchesFilter) {
            filteredBottles += orderQty;
            filteredRevenue += pricing.total || 0;
            filteredDiscount += pricing.discount || 0;
            if (order.paymentMethod === 'cash') {
                filteredCashRevenue += pricing.total || 0;
            } else if (order.paymentMethod === 'scan') {
                filteredScanRevenue += pricing.total || 0;
            } else if (order.paymentMethod === 'unpaid') {
                filteredUnpaidRevenue += pricing.total || 0;
            }
            if (order.deliveryType !== 'grab' && matchesStaff) {
                filteredCommBottles += orderQty;
            }
            
            // Channel stats (only for filtered dates)
            const type = order.deliveryType;
            if (deliveryStats.hasOwnProperty(type)) {
                deliveryStats[type]++;
            } else {
                deliveryStats.other++;
            }
            
            // Accumulate popularity (only for filtered dates)
            if (order.items) {
                Object.keys(order.items).forEach(drinkId => {
                    const baseDrinkId = drinkId.replace(/_(old|new)$/, '');
                    if (popTracker.hasOwnProperty(baseDrinkId)) {
                        popTracker[baseDrinkId] += order.items[drinkId];
                    }
                });
            }
        }
    });
    
    // Add manual grab logs items to popularity as well, if they are not linked to any order
    state.grabPickups.forEach(grab => {
        if (!grab.orderId) { // only count manual ones
            const grabDate = getLocalDateString(new Date(grab.timestamp));
            let matchesFilter = false;
            if (filterVal === 'today' && grabDate === todayStr) matchesFilter = true;
            else if (filterVal === 'yesterday' && grabDate === yesterdayStr) matchesFilter = true;
            else if (filterVal === 'custom' && grabDate === customDateVal) matchesFilter = true;
            else if (filterVal === 'all') matchesFilter = true;
            
            if (matchesFilter) {
                Object.keys(grab.items).forEach(drinkId => {
                    const baseDrinkId = drinkId.replace(/_(old|new)$/, '');
                    if (popTracker.hasOwnProperty(baseDrinkId)) {
                        popTracker[baseDrinkId] += grab.items[drinkId];
                    }
                });
            }
        }
    });
    
    // Set dynamic commission label
    let targetCommText = 'ค่าคอมมิชชั่นวันนี้';
    if (filterVal === 'yesterday') {
        targetCommText = 'ค่าคอมมิชชั่นเมื่อวาน';
    } else if (filterVal === 'custom') {
        const dObj = new Date(customDateVal);
        const formatThai = isNaN(dObj.getTime()) ? customDateVal : dObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        targetCommText = `ค่าคอมมิชชั่นวันที่ ${formatThai}`;
    } else if (filterVal === 'all') {
        targetCommText = 'ค่าคอมมิชชั่นทั้งหมด';
    }
    
    const commTitleEl = document.getElementById('analytics-comm-title');
    if (commTitleEl) {
        commTitleEl.textContent = targetCommText;
    }
    
    // Update counters in DOM
    document.getElementById('analytics-today-revenue').textContent = `${filteredRevenue.toLocaleString()} บาท`;
    document.getElementById('analytics-today-bottles').textContent = `${filteredBottles} ขวด`;
    const payDetailsEl = document.getElementById('analytics-today-payment-details');
    if (payDetailsEl) {
        payDetailsEl.textContent = `โอน/สแกน: ${filteredScanRevenue.toLocaleString()} บาท | เงินสด: ${filteredCashRevenue.toLocaleString()} บาท` + 
            (filteredUnpaidRevenue > 0 ? ` | ยังไม่จ่าย: ${filteredUnpaidRevenue.toLocaleString()} บาท` : '');
    }
    document.getElementById('analytics-total-revenue-all').textContent = `${totalRevenue.toLocaleString()} บาท`;
    document.getElementById('analytics-total-bottles-all').textContent = `${totalBottles} ขวด`;
    document.getElementById('analytics-total-discount').textContent = `${filteredDiscount.toLocaleString()} บาท`;
    
    const filteredCommVal = filteredCommBottles * 5;
    const totalCommVal = totalCommBottles * 5;
    document.getElementById('analytics-commission').textContent = `${filteredCommVal.toLocaleString()} บาท`;
    document.getElementById('analytics-commission-sub').textContent = `คิดจาก ${filteredCommBottles} ขวด (สะสมทั้งหมด: ${totalCommVal.toLocaleString()} บาท)`;
    
    const commCard = document.getElementById('analytics-commission-card');
    if (commCard) {
        if (isLoggedInStaff) {
            commCard.style.display = 'flex';
        } else {
            commCard.style.display = 'none';
        }
    }
    
    document.getElementById('stat-delivery-walkin').textContent = `${deliveryStats.walkin} บิล`;
    document.getElementById('stat-delivery-grab').textContent = `${deliveryStats.grab} บิล`;
    document.getElementById('stat-delivery-other').textContent = `${deliveryStats.other} บิล`;
    
    // 2. RENDER BEVERAGES SALES SUMMARY
    const sortedPopular = Object.keys(popTracker)
        .map(id => {
            const drink = getDrinkById(id);
            const batchSuffix = getBatchSuffix(id);
            return {
                id: id,
                nameTH: drink ? `${drink.nameTH}${batchSuffix}` : id,
                qty: popTracker[id]
            };
        })
        .sort((a, b) => b.qty - a.qty);
        
    const popularContainer = document.getElementById('popular-drinks-list');
    if (!popularContainer) return;
    
    const maxQty = sortedPopular.length > 0 ? sortedPopular[0].qty : 0;
    const totalQtyPeriod = sortedPopular.reduce((sum, item) => sum + item.qty, 0);
    
    if (maxQty === 0 || totalQtyPeriod === 0) {
        popularContainer.innerHTML = `<div class="text-muted text-center py-4">ยังไม่มีข้อมูลยอดขายช่วงนี้</div>`;
        return;
    }
    
    let bannerHtml = '';
    if (sortedPopular.length > 0 && sortedPopular[0].qty > 0) {
        const topSeller = sortedPopular[0];
        const drink = getDrinkById(topSeller.id);
        const drinkColor = drink ? drink.color : '#f59e0b';
        bannerHtml = `
            <div class="top-seller-banner" style="display: flex; align-items: center; gap: 0.75rem; background: rgba(245, 158, 11, 0.05); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: var(--radius-sm); padding: 0.75rem 1.25rem; margin-bottom: 1.25rem; animation: loginFadeIn 0.5s ease-out;">
                <div style="font-size: 1.8rem; color: #f59e0b;"><i class="fa-solid fa-crown"></i></div>
                <div>
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">สินค้าขายดีอันดับ 1 ในช่วงนี้</div>
                    <div style="font-size: 1.05rem; font-weight: 800; color: var(--color-text);">${topSeller.nameTH} <span style="color: ${drinkColor}; font-weight: 800;">(ขายได้ ${topSeller.qty} ขวด)</span></div>
                </div>
            </div>
        `;
    }
    
    popularContainer.innerHTML = bannerHtml + sortedPopular.map((item, idx) => {
        const drink = getDrinkById(item.id);
        const drinkColor = drink ? drink.color : 'var(--color-primary)';
        const drinkColorRgb = drink ? drink.colorRgb : '29, 78, 216';
        const percentage = maxQty > 0 ? (item.qty / maxQty) * 100 : 0;
        const sharePercentage = totalQtyPeriod > 0 ? (item.qty / totalQtyPeriod) * 100 : 0;
        
        return `
            <div class="ranking-item">
                <div class="ranking-drink-info">
                    <span class="ranking-num">${idx + 1}</span>
                    <span class="ranking-name">${item.nameTH}</span>
                </div>
                <div class="ranking-bar-wrapper">
                    <div class="ranking-bar" style="width: ${percentage}%; background: ${drinkColor}; box-shadow: 0 0 8px rgba(${drinkColorRgb}, 0.5);"></div>
                </div>
                <span class="ranking-qty" style="color: ${drinkColor}; font-weight: 700;">${item.qty} ขวด <span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500;">(${sharePercentage.toFixed(1)}%)</span></span>
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
    downloadAnchor.setAttribute("download", `baan_phuan_backup_${dateStr}.json`);
    
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
                renderTables();
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
        renderTables();
        renderOrders();
        renderGrabLogs();
        renderAnalytics();
        
        document.getElementById('backup-modal').classList.remove('active');
        alert("ล้างข้อมูลทั้งหมดในระบบแล้ว");
    }
}

// TOAST NOTIFICATION MODULE
function showToast(message, duration = 3000) {
    let toast = document.createElement('div');
    toast.className = 'supabase-toast';
    toast.innerHTML = `<i class="fa-solid fa-bolt text-primary" style="color: var(--color-primary) !important;"></i> <span>${message}</span>`;
    
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#f8fafc',
        padding: '0.75rem 1.25rem',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 10px rgba(99, 102, 241, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: "'Prompt', sans-serif",
        fontSize: '0.85rem',
        zIndex: '9999',
        transform: 'translateY(50px)',
        opacity: '0',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease'
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    }, 50);
    
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// SUPABASE CLIENT & REALTIME MODULE
function initSupabaseClient() {
    if (state.supabaseUrl && state.supabaseKey && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseKey);
            setupSupabaseRealtime();
        } catch (e) {
            console.error("Failed to initialize Supabase client:", e);
        }
    }
}

function setupSupabaseRealtime() {
    if (!supabaseClient) return;
    
    if (supabaseSubscription) {
        supabaseSubscription.unsubscribe();
    }
    
    try {
        supabaseSubscription = supabaseClient
            .channel('public:app_state')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'app_state',
                filter: 'id=eq.current_state'
            }, (payload) => {
                console.log("Realtime change received:", payload);
                const newData = payload.new?.data;
                
                if (newData) {
                    if (state.editingOrderId) {
                        console.log("Ignore realtime update because we are editing an order.");
                        return;
                    }
                    
                    const localStr = JSON.stringify({
                        orders: state.orders,
                        grabPickups: state.grabPickups,
                        stock: state.stock,
                        stockDates: state.stockDates || {},
                        users: state.users
                    });
                    const remoteStr = JSON.stringify({
                        orders: newData.orders || [],
                        grabPickups: newData.grabPickups || [],
                        stock: newData.stock || {},
                        stockDates: newData.stockDates || {},
                        users: newData.users || []
                    });
                    
                    if (localStr !== remoteStr) {
                        console.log("Applying realtime update to local state.");
                        state.orders = newData.orders || [];
                        state.grabPickups = newData.grabPickups || [];
                        state.stock = newData.stock || {};
                        state.stockDates = newData.stockDates || {};
                        
                        if (newData.users && Array.isArray(newData.users) && newData.users.length > 0) {
                            state.users = newData.users;
                            localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
                            renderLoginUserDropdown();
                            renderAdminUsersList();
                        }
                        
                        DRINKS.forEach(drink => {
                            if (state.stock[drink.id + '_old'] === undefined) {
                                state.stock[drink.id + '_old'] = 20;
                            }
                            if (state.stock[drink.id + '_new'] === undefined) {
                                state.stock[drink.id + '_new'] = 0;
                            }
                            if (!state.stockDates) state.stockDates = {};
                            if (state.stockDates[drink.id + '_old'] === undefined) {
                                state.stockDates[drink.id + '_old'] = '';
                            }
                            if (state.stockDates[drink.id + '_new'] === undefined) {
                                state.stockDates[drink.id + '_new'] = '';
                            }
                        });
                        
                        saveToLocalStorage(true);
                        
                        renderTables();
                        renderOrders();
                        renderGrabLogs();
                        renderStock();
                        renderAnalytics();
                        
                        showToast("ซิงค์ข้อมูลล่าสุดจากร้านแล้ว ⚡");
                    }
                }
            })
            .subscribe((status) => {
                console.log("Realtime subscription status:", status);
            });
    } catch (e) {
        console.error("Failed to establish realtime subscription:", e);
    }
}

// SUPABASE SYNC MODULE
async function pullFromSupabase(isSilent = false) {
    if (!state.supabaseUrl || !state.supabaseKey) {
        if (!isSilent) alert("กรุณาระบุ Supabase URL และ Anon Key ก่อนดึงข้อมูล");
        return;
    }
    
    const pullBtn = document.getElementById('btn-pull-sheet');
    const originalText = pullBtn ? pullBtn.innerHTML : '';
    
    if (!isSilent && pullBtn) {
        pullBtn.disabled = true;
        pullBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดึงข้อมูล...';
    }
    
    try {
        const syncUrl = `${state.supabaseUrl}/rest/v1/app_state?id=eq.current_state`;
        const response = await fetch(syncUrl, {
            headers: {
                'apikey': state.supabaseKey,
                'Authorization': `Bearer ${state.supabaseKey}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error("HTTP Error: " + response.status);
        
        const dataList = await response.json();
        if (dataList && dataList.length > 0 && dataList[0].data) {
            const data = dataList[0].data;
            state.orders = data.orders || [];
            state.grabPickups = data.grabPickups || [];
            state.stock = data.stock || {};
            state.stockDates = data.stockDates || {};
            
            normalizeLegacyStateData(state);
            
            // Sync users if present
            if (data.users && Array.isArray(data.users) && data.users.length > 0) {
                state.users = data.users;
                localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
                renderLoginUserDropdown();
                renderAdminUsersList();
            }
            
            // Save to LocalStorage skipping the auto-push sync loop
            saveToLocalStorage(true);
            
            // Refresh POS UI
            renderTables();
            renderOrders();
            renderGrabLogs();
            renderStock();
            renderAnalytics();
            
            if (!isSilent) {
                alert("ดึงข้อมูลจาก Supabase สำเร็จเรียบร้อยแล้ว!");
            } else {
                console.log("Auto-pulled from Supabase successfully.");
            }
        } else {
            throw new Error("ไม่พบข้อมูล หรือรูปแบบข้อมูลใน Supabase ไม่ถูกต้อง (กรุณาตรวจสอบว่ามีข้อมูล id = 'current_state' ในตาราง app_state หรือไม่)");
        }
    } catch (err) {
        console.error("Failed to pull from Supabase:", err);
        if (!isSilent) {
            alert("ดึงข้อมูลล้มเหลว: " + err.message + "\n\nกรุณาตรวจสอบว่า:\n1. URL และ Anon Key ถูกต้อง\n2. สร้างตาราง app_state ใน Supabase แล้ว\n3. ปิด RLS หรือตั้งค่า Policy สำหรับอ่านข้อมูลแล้ว");
        }
        throw err;
    } finally {
        if (!isSilent && pullBtn) {
            pullBtn.disabled = false;
            pullBtn.innerHTML = originalText;
        }
    }
}

async function pushToSupabase(isAuto = false) {
    if (!state.supabaseUrl || !state.supabaseKey) {
        if (!isAuto) alert("กรุณาระบุ Supabase URL และ Anon Key ก่อนบันทึกข้อมูล");
        return;
    }
    
    const pushBtn = document.getElementById('btn-push-sheet');
    const originalText = pushBtn ? pushBtn.innerHTML : '';
    
    if (!isAuto && pushBtn) {
        pushBtn.disabled = true;
        pushBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';
    }
    
    try {
        const syncUrl = `${state.supabaseUrl}/rest/v1/app_state`;
        const payloadObj = {
            id: 'current_state',
            data: {
                orders: state.orders,
                grabPickups: state.grabPickups,
                stock: state.stock,
                stockDates: state.stockDates || {},
                users: state.users
            },
            updated_at: new Date().toISOString()
        };
        
        const response = await fetch(syncUrl, {
            method: 'POST',
            headers: {
                'apikey': state.supabaseKey,
                'Authorization': `Bearer ${state.supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payloadObj)
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${errText}`);
        }
        
        if (!isAuto) {
            alert("บันทึกข้อมูลลง Supabase สำเร็จเรียบร้อยแล้ว!");
        } else {
            console.log("Auto-synced to Supabase.");
        }
    } catch (err) {
        console.error("Failed to push to Supabase:", err);
        if (!isAuto) {
            alert("บันทึกข้อมูลลง Supabase ล้มเหลว: " + err.message);
        }
    } finally {
        if (!isAuto && pushBtn) {
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
        const qtyOld = state.stock[drink.id + '_old'] !== undefined ? state.stock[drink.id + '_old'] : 20;
        const qtyNew = state.stock[drink.id + '_new'] !== undefined ? state.stock[drink.id + '_new'] : 0;
        
        const dateOld = state.stockDates[drink.id + '_old'] || '';
        const dateNew = state.stockDates[drink.id + '_new'] || '';
        
        let statusBadgeOld = '';
        if (qtyOld === 0) {
            statusBadgeOld = '<span class="badge badge-danger">❌ หมด</span>';
        } else if (qtyOld <= 5) {
            statusBadgeOld = '<span class="badge badge-warning">⚠️ ใกล้หมด</span>';
        } else {
            statusBadgeOld = '<span class="badge badge-success">ปกติ</span>';
        }
        
        let statusBadgeNew = '';
        if (qtyNew === 0) {
            statusBadgeNew = '<span class="badge badge-danger">❌ หมด</span>';
        } else if (qtyNew <= 5) {
            statusBadgeNew = '<span class="badge badge-warning">⚠️ ใกล้หมด</span>';
        } else {
            statusBadgeNew = '<span class="badge badge-success">ปกติ</span>';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${drink.color};"></div>
                    <div style="text-align: left;">
                        <strong style="color: var(--color-text);">${drink.nameTH}</strong>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">${drink.nameEN}</div>
                    </div>
                </div>
            </td>
            <!-- ล็อตเก่า -->
            <td>
                <div style="display: flex; flex-direction: column; gap: 0.45rem; align-items: center; background: rgba(29, 78, 216, 0.02); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(29, 78, 216, 0.06);">
                    <div class="stock-qty-control" style="display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_old', -5)">-5</button>
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_old', -1)">-1</button>
                        <input type="number" id="stock-input-${drink.id}-old" value="${qtyOld}" min="0" style="width: 45px; text-align: center; font-weight: bold; background: rgba(255, 255, 255, 0.85); border: 1px solid var(--border-glass); color: var(--color-text); padding: 0.15rem 0.25rem; border-radius: var(--radius-sm); font-size: 0.85rem;" onchange="updateStockFromInput('${drink.id}_old', this.value)">
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_old', 1)">+1</button>
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_old', 5)">+5</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.3rem; width: 100%; justify-content: center;">
                        <input type="date" id="stock-date-${drink.id}-old" value="${dateOld}" style="padding: 0.15rem 0.25rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-glass); background: #fff; width: 110px;" onchange="updateStockDate('${drink.id}_old', this.value)">
                        <button class="btn btn-danger btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; border-radius: 4px;" onclick="clearStock('${drink.id}_old')" title="ตัดน้ำเสียทั้งหมด (เคลียร์เป็น 0)">ตัดเสีย</button>
                    </div>
                    <div style="margin-top: 0.1rem;">${statusBadgeOld}</div>
                </div>
            </td>
            <!-- ล็อตใหม่ -->
            <td>
                <div style="display: flex; flex-direction: column; gap: 0.45rem; align-items: center; background: rgba(2, 132, 199, 0.02); padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid rgba(2, 132, 199, 0.06);">
                    <div class="stock-qty-control" style="display: flex; align-items: center; justify-content: center; gap: 0.25rem;">
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_new', -5)">-5</button>
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_new', -1)">-1</button>
                        <input type="number" id="stock-input-${drink.id}-new" value="${qtyNew}" min="0" style="width: 45px; text-align: center; font-weight: bold; background: rgba(255, 255, 255, 0.85); border: 1px solid var(--border-glass); color: var(--color-text); padding: 0.15rem 0.25rem; border-radius: var(--radius-sm); font-size: 0.85rem;" onchange="updateStockFromInput('${drink.id}_new', this.value)">
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_new', 1)">+1</button>
                        <button class="btn btn-outline btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.75rem;" onclick="adjustStockValue('${drink.id}_new', 5)">+5</button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.3rem; width: 100%; justify-content: center;">
                        <input type="date" id="stock-date-${drink.id}-new" value="${dateNew}" style="padding: 0.15rem 0.25rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-glass); background: #fff; width: 110px;" onchange="updateStockDate('${drink.id}_new', this.value)">
                        <button class="btn btn-danger btn-sm" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; border-radius: 4px;" onclick="clearStock('${drink.id}_new')" title="ตัดน้ำเสียทั้งหมด (เคลียร์เป็น 0)">ตัดเสีย</button>
                    </div>
                    <div style="margin-top: 0.1rem;">${statusBadgeNew}</div>
                </div>
            </td>
        `;
        listContainer.appendChild(row);
    });
}

// ADJUST STOCK BY DELTA
function adjustStockValue(batchKey, delta) {
    const defaultQty = batchKey.endsWith('_new') ? 0 : 20;
    const currentVal = state.stock[batchKey] !== undefined ? state.stock[batchKey] : defaultQty;
    const newVal = Math.max(0, currentVal + delta);
    state.stock[batchKey] = newVal;
    
    saveToLocalStorage();
    renderStock();
    renderDrinkGrid(); // Update POS cards stock indicator as well
}

// UPDATE STOCK DIRECTLY FROM INPUT
function updateStockFromInput(batchKey, value) {
    const newVal = Math.max(0, parseInt(value) || 0);
    state.stock[batchKey] = newVal;
    
    saveToLocalStorage();
    renderStock();
    renderDrinkGrid();
}

// UPDATE STOCK DATE
function updateStockDate(batchKey, dateValue) {
    if (!state.stockDates) state.stockDates = {};
    state.stockDates[batchKey] = dateValue;
    saveToLocalStorage();
}

// CLEAR STOCK TO 0 (ตัดเสีย)
function clearStock(batchKey) {
    const drink = getDrinkById(batchKey);
    const suffix = getBatchSuffix(batchKey);
    const drinkName = drink ? `${drink.nameTH}${suffix}` : batchKey;
    if (confirm(`คุณแน่ใจหรือไม่ที่จะปรับสต็อกของ "${drinkName}" ให้เป็น 0 (ตัดน้ำเสียทั้งหมด)?`)) {
        state.stock[batchKey] = 0;
        saveToLocalStorage();
        renderStock();
        renderDrinkGrid();
    }
}

// SWITCH TABS
function switchTab(tabId) {
    try {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(b => {
            if (b.getAttribute('data-tab') === tabId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        
        state.tab = tabId;
        
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
        
        // Toggle full-width admin mode class
        if (tabId === 'admin-tab') {
            document.body.classList.add('admin-active');
        } else {
            document.body.classList.remove('admin-active');
        }
        
        // Re-render corresponding tab
        if (tabId === 'tables-tab') {
            renderTables();
        } else if (tabId === 'orders-tab') {
            renderOrders();
        } else if (tabId === 'promo-tab') {
            renderPromoTab();
        } else if (tabId === 'stock-tab') {
            renderStock();
        } else if (tabId === 'summary-tab') {
            renderAnalytics();
        } else if (tabId === 'admin-tab') {
            renderAdminUsersList();
        }
    } catch (e) {
        console.error("Error in switchTab: ", e);
    }
}

// INITIALIZE LOGIN USERNAME FIELD
function renderLoginUserDropdown() {
    const loginUsernameInput = document.getElementById('login-username');
    if (!loginUsernameInput) return;
    
    const lastStaff = localStorage.getItem('juice_bar_last_staff') || '';
    loginUsernameInput.value = lastStaff;
    
    const pinInput = document.getElementById('login-pin');
    if (pinInput) pinInput.value = '';
}

// RENDER ADMIN USERS LIST TABLE
function renderAdminUsersList() {
    try {
        const listContainer = document.getElementById('admin-users-list');
        if (!listContainer) return;
        
        if (!state.users || !Array.isArray(state.users)) {
            listContainer.innerHTML = `<tr><td colspan="5" class="text-center text-muted">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
            return;
        }

        if (state.users.length === 0) {
            listContainer.innerHTML = `<tr><td colspan="5" class="text-center text-muted">ไม่มีข้อมูลพนักงาน</td></tr>`;
            return;
        }
        
        listContainer.innerHTML = state.users.map(user => {
            if (!user) return '';
            const roleText = user.role === 'admin' ? 'ผู้ดูแล (Admin)' : 'พนักงาน (Staff)';
            const roleBadge = user.role === 'admin' ? 'badge-primary' : 'badge-outline';
            const iconClass = user.role === 'admin' ? 'fa-user-shield text-primary' : 'fa-user text-muted';
            
            // Calculate commission for this user
            let commHtml = '-';
            if (user.role === 'staff') {
                let userCommBottles = 0;
                state.orders.forEach(order => {
                    if (order.status === 'pending_promo' || order.status === 'unpaid') return;
                    if (order.deliveryType === 'grab') return;
                    if (order.staffName && order.staffName.toLowerCase() === user.username.toLowerCase()) {
                        const orderQty = order.items ? Object.values(order.items).reduce((sum, q) => sum + q, 0) : 0;
                        userCommBottles += orderQty;
                    }
                });
                const userCommVal = userCommBottles * 5;
                commHtml = `<strong class="text-success">${userCommVal.toLocaleString()} บาท</strong> (${userCommBottles} ขวด)`;
            }
            
            return `
                <tr>
                    <td style="font-weight: 600; color: var(--color-text);">
                        <i class="fa-solid ${iconClass}"></i> ${user.username || 'ไม่มีชื่อ'}
                    </td>
                    <td style="text-align: center;">
                        <span class="badge ${roleBadge}">
                            ${roleText}
                        </span>
                    </td>
                    <td style="text-align: center; font-family: monospace; letter-spacing: 2px; color: var(--color-text);">
                        •••• (PIN: ${user.pin || ''})
                    </td>
                    <td style="text-align: center; color: var(--color-text);">
                        ${commHtml}
                    </td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 0.5rem; justify-content: center;">
                            <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" onclick="editAdminUser('${user.username || ''}')" title="แก้ไข">
                                <i class="fa-solid fa-user-pen"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" style="padding: 0.25rem 0.5rem; background: var(--color-danger);" onclick="deleteAdminUser('${user.username || ''}')" title="ลบ">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error("Error in renderAdminUsersList: ", e);
    }
}

// EDIT USER IN ADMIN PANEL
function editAdminUser(username) {
    const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return;
    
    document.getElementById('admin-username').value = user.username;
    document.getElementById('admin-pin').value = user.pin;
    document.getElementById('admin-role').value = user.role;
    document.getElementById('admin-edit-original-username').value = user.username;
    document.getElementById('btn-admin-cancel-edit').style.display = 'inline-block';
    
    // Scroll form into view on mobile
    document.getElementById('admin-user-form').scrollIntoView({ behavior: 'smooth' });
}

// DELETE USER IN ADMIN PANEL
function deleteAdminUser(username) {
    const currentLoggedIn = sessionStorage.getItem('baanphuan_username');
    if (username && currentLoggedIn && username.toLowerCase() === currentLoggedIn.toLowerCase()) {
        alert('ไม่สามารถลบตัวเองได้ขณะกำลังล็อกอินใช้งาน');
        return;
    }
    
    // Prevent deleting the last admin
    const userToDelete = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userToDelete && userToDelete.role === 'admin') {
        const adminCount = state.users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1) {
            alert('ไม่สามารถลบได้ เนื่องจากต้องมีผู้ดูแลระบบ (Admin) อย่างน้อย 1 คน');
            return;
        }
    }
    
    if (confirm(`คุณต้องการลบพนักงาน "${username}" ใช่หรือไม่?`)) {
        state.users = state.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
        saveUsersToLocalStorage();
        renderLoginUserDropdown();
        renderAdminUsersList();
    }
}
// SUBMIT LOGIN AUTHENTICATION

function submitLogin() {
    const usernameInput = document.getElementById('login-username');
    const pinInput = document.getElementById('login-pin');
    if (!usernameInput || !pinInput) return;
    
    const username = usernameInput.value.trim();
    const pin = pinInput.value.trim();
    
    // Find user in database (case-insensitive)
    const foundUser = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (foundUser && foundUser.pin === pin) {
        const correctUsername = foundUser.username;
        sessionStorage.setItem('baanphuan_logged_in', 'true');
        sessionStorage.setItem('baanphuan_username', correctUsername);
        sessionStorage.setItem('baanphuan_role', foundUser.role);
        localStorage.setItem('juice_bar_last_staff', correctUsername);
        document.getElementById('login-error-msg').style.display = 'none';
        pinInput.value = '';
        checkLoginStatus();
    } else {
        const errorMsg = document.getElementById('login-error-msg');
        errorMsg.style.display = 'flex';
        errorMsg.style.animation = 'none';
        errorMsg.offsetHeight; /* trigger reflow */
        errorMsg.style.animation = 'shake 0.3s ease';
        
        // Clear pin on error
        pinInput.value = '';
        pinInput.focus();
    }
}

// COPY TO CLIPBOARD HELPER
function copyToClipboard(text, successMessage = "คัดลอกลงคลิปบอร์ดแล้ว!") {
    navigator.clipboard.writeText(text).then(() => {
        alert(successMessage);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        // Fallback for older browsers
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = text;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            document.execCommand("copy");
            alert(successMessage);
        } catch (e) {
            alert("ไม่สามารถคัดลอกได้อัตโนมัติ กรุณาลองคัดลอกด้วยตนเอง");
        }
        document.body.removeChild(tempTextArea);
    });
}

// COPY SINGLE ORDER TO FORMATTED TEXT
function copyOrderToText(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const deliveryName = order.deliveryType === 'grab' ? 'Grab Delivery' : (order.deliveryType === 'walkin' ? 'รับเอง/หน้าร้าน' : 'อื่นๆ');
    const payMethodName = order.paymentMethod === 'cash' ? 'เงินสด' : (order.paymentMethod === 'unpaid' ? 'ยังไม่จ่าย' : 'เงินโอน / สแกน');
    
    let itemsText = '';
    const drinkKeys = Object.keys(order.items);
    drinkKeys.forEach(drinkId => {
        const drink = getDrinkById(drinkId);
        if (drink) {
            const batchSuffix = getBatchSuffix(drinkId);
            itemsText += `• ${drink.nameTH}${batchSuffix} (${drink.nameEN}) x${order.items[drinkId]} ขวด\n`;
        }
    });
    
    const isPendingPromo = order.status === 'pending_promo';
    const isUnpaid = order.status === 'unpaid';
    const totalQty = Object.values(order.items).reduce((a, b) => a + b, 0);
    const netTotal = isPendingPromo ? 0 : (order.priceDetails ? order.priceDetails.total : 0);
    const discountText = (!isPendingPromo && order.priceDetails && order.priceDetails.discount > 0) ? ` (ประหยัดโปรโมชั่นไป ${order.priceDetails.discount} บ.)` : '';
    const pendingNote = isPendingPromo ? ' (ยังไม่ครบโปร)' : (isUnpaid ? ' (ยังไม่จ่ายเงิน)' : '');
    const remarkText = order.remark ? `หมายเหตุ: ${order.remark}\n` : '';
    const staffText = order.staffName ? `ผู้บันทึก: ${order.staffName}\n` : '';
    
    const receiptText = `📝 บิลร้านบ้านเพื่อน (BaanPhuan)
---------------------------------
วันที่: ${order.date} (${order.time})
ลูกค้า: ${order.customerName}
ช่องทาง: ${deliveryName}
การชำระเงิน: ${payMethodName}
${staffText}${remarkText}---------------------------------
รายการเครื่องดื่ม:
${itemsText}---------------------------------
🥤 รวมทั้งหมด: ${totalQty} ขวด
💰 ยอดชำระสุทธิ: ${netTotal} บาท${discountText}${pendingNote}`;

    copyToClipboard(receiptText, "คัดลอกข้อความบิลเรียบร้อยแล้ว!");
}

// COPY DAILY SUMMARY TO FORMATTED TEXT
// COPY DAILY SUMMARY TO FORMATTED TEXT
function copyDailySummaryToText() {
    const todayStr = getLocalDateString(new Date());
    
    let yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate);
    
    // Get filter settings from Summary tab
    const summaryFilterDate = document.getElementById('summary-filter-date');
    const filterVal = summaryFilterDate ? summaryFilterDate.value : 'today';
    const summaryFilterCustomDate = document.getElementById('summary-filter-custom-date');
    const customDateVal = summaryFilterCustomDate ? summaryFilterCustomDate.value : todayStr;
    
    let targetDateText = 'วันนี้';
    if (filterVal === 'yesterday') {
        targetDateText = 'เมื่อวาน';
    } else if (filterVal === 'custom') {
        const dObj = new Date(customDateVal);
        targetDateText = isNaN(dObj.getTime()) ? customDateVal : dObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (filterVal === 'all') {
        targetDateText = 'ทั้งหมด (ทุกวัน)';
    }

    let filteredRevenue = 0;
    let filteredBottles = 0;
    let filteredScanRevenue = 0;
    let filteredCashRevenue = 0;
    let filteredUnpaidRevenue = 0;
    let pendingPromoList = [];
    
    state.orders.forEach(order => {
        const orderQty = order.items ? Object.values(order.items).reduce((a, b) => a + b, 0) : 0;
        const pricing = order.priceDetails || { total: 0, discount: 0 };
        
        let matchesFilter = false;
        if (filterVal === 'today' && order.date === todayStr) matchesFilter = true;
        else if (filterVal === 'yesterday' && order.date === yesterdayStr) matchesFilter = true;
        else if (filterVal === 'custom' && order.date === customDateVal) matchesFilter = true;
        else if (filterVal === 'all') matchesFilter = true;
        
        if (matchesFilter) {
            // Check if order is pending promotion
            if (order.status === 'pending_promo') {
                pendingPromoList.push({
                    name: order.customerName,
                    qty: orderQty,
                    price: pricing.total || 0
                });
            } else {
                filteredBottles += orderQty;
                filteredRevenue += pricing.total || 0;
                if (order.paymentMethod === 'cash') {
                    filteredCashRevenue += pricing.total || 0;
                } else if (order.paymentMethod === 'scan') {
                    filteredScanRevenue += pricing.total || 0;
                } else if (order.paymentMethod === 'unpaid') {
                    filteredUnpaidRevenue += pricing.total || 0;
                }
            }
        }
    });
    
    // Generate text for pending promotion customers
    let pendingText = '';
    if (pendingPromoList.length === 0) {
        pendingText = '- ไม่มีรายการค้างโปร\n';
    } else {
        pendingPromoList.forEach(item => {
            let cleanName = item.name || '';
            const match = cleanName.match(/\(([^)]+)\)/);
            if (match) {
                cleanName = match[1];
            }
            cleanName = cleanName.replace(/^คุณ\s*/, '').trim();
            pendingText += `- ${cleanName}: ${item.qty} ขวด\n`;
        });
    }
    
    const summaryText = `📊 สรุปยอดขายร้านบ้านเพื่อน (BaanPhuan)
ประจำ: ${targetDateText}
---------------------------------
🥤 ขายได้ทั้งหมด: ${filteredBottles} ขวด
💰 ยอดขายรวม: ${filteredRevenue.toLocaleString()} บาท
   • โอน/สแกน: ${filteredScanRevenue.toLocaleString()} บาท
   • เงินสด: ${filteredCashRevenue.toLocaleString()} บาท` + 
   (filteredUnpaidRevenue > 0 ? `\n   • ยังไม่จ่าย: ${filteredUnpaidRevenue.toLocaleString()} บาท` : '') + `
---------------------------------
⚠️ รายชื่อลูกค้าที่ยังไม่ครบโปร:
${pendingText}---------------------------------`;

    copyToClipboard(summaryText, `คัดลอกสรุปยอดขาย (${targetDateText}) เรียบร้อยแล้ว!`);
}

// TOGGLE ORDER PROMO STATUS
function toggleOrderStatus(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (order.status === 'pending_promo' || order.status === 'unpaid') {
        order.status = 'paid';
        order.previouslyPaid = order.priceDetails ? order.priceDetails.total : 0;
        if (order.paymentMethod === 'unpaid') {
            order.paymentMethod = 'scan';
        }
    } else {
        order.status = 'unpaid';
    }
    saveToLocalStorage();
    renderTables();
    renderOrders();
    renderAnalytics();
}

// RENDER TABLES GRID
let _payingOrderId = null;
let _payingMethod = 'scan';

function renderTables() {
    const gridContainer = document.getElementById('tables-grid-container');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    // Auto-update cancel button visibility for the POS
    updateCancelTableButtonVisibility();
    
    const totalTables = 8;
    const todayStr = getLocalDateString(new Date());
    
    // ─── Update Live Stats ───
    let occupiedCount = 0;  // pending (ค้างชำระ)
    let paidSeatedCount = 0; // paid but still seated
    let emptyCount = 0;
    let pendingTotal = 0;
    let todayRevenue = 0;
    
    state.orders.forEach(o => {
        if (o.date === todayStr) {
            if (o.status !== 'pending_promo') {
                todayRevenue += (o.priceDetails ? o.priceDetails.total : 0);
            } else {
                // If order is reopened / pending promo, count what has been paid so far in today's revenue
                todayRevenue += (o.previouslyPaid || 0);
            }
        }
        if ((o.status === 'pending_promo' || o.status === 'unpaid') && o.customerName && o.customerName.startsWith('โต๊ะ ')) {
            const total = o.priceDetails ? o.priceDetails.total : 0;
            const prevPaid = o.previouslyPaid || 0;
            pendingTotal += Math.max(0, total - prevPaid);
        }
    });
    
    for (let i = 1; i <= totalTables; i++) {
        const tableName = `โต๊ะ ${i}`;
        const hasPending = state.orders.some(o =>
            (o.customerName === tableName || o.customerName.startsWith(tableName + ' (')) &&
            o.date === todayStr && (o.status === 'pending_promo' || o.status === 'unpaid')
        );
        const hasPaid = !hasPending && state.orders.some(o =>
            (o.customerName === tableName || o.customerName.startsWith(tableName + ' (')) &&
            o.date === todayStr && o.status === 'paid' && !o.tableClosed
        );
        if (hasPending) occupiedCount++;
        else if (hasPaid) paidSeatedCount++;
        else emptyCount++;
    }
    
    const elEmpty = document.getElementById('stat-tables-empty');
    const elOccupied = document.getElementById('stat-tables-occupied');
    const elPending = document.getElementById('stat-tables-pending-total');
    const elToday = document.getElementById('stat-today-revenue');
    if (elEmpty) elEmpty.textContent = emptyCount;
    if (elOccupied) elOccupied.textContent = `${occupiedCount}ค้าง / ${paidSeatedCount}จ่ายแล้ว`;
    if (elPending) elPending.textContent = pendingTotal.toLocaleString();
    if (elToday) elToday.textContent = todayRevenue.toLocaleString();
    
    for (let i = 1; i <= totalTables; i++) {
        const tableName = `โต๊ะ ${i}`;
        
        // Find if there is an active (pending/unpaid) order for this table today
        // Find pending (unpaid) order for this table today
        const pendingOrder = state.orders.find(o =>
            (o.customerName === tableName || o.customerName.startsWith(tableName + ' (')) &&
            o.date === todayStr && (o.status === 'pending_promo' || o.status === 'unpaid')
        );
        // Find most recent paid order for this table today (only if no pending, not closed)
        const paidOrder = !pendingOrder ? state.orders.find(o =>
            (o.customerName === tableName || o.customerName.startsWith(tableName + ' (')) &&
            o.date === todayStr && o.status === 'paid' && !o.tableClosed
        ) : null;
        
        const card = document.createElement('div');
        
        if (pendingOrder) {
            // 🟡 STATE 1: มีคน + ยังไม่จ่าย
            card.className = 'table-card table-occupied';
            let itemsHtml = '';
            if (pendingOrder.items) {
                for (const drinkId in pendingOrder.items) {
                    const drink = getDrinkById(drinkId);
                    if (drink) {
                        const batchSuffix = getBatchSuffix(drinkId);
                        itemsHtml += `<div class="table-bill-item"><span>${drink.nameTH}${batchSuffix}</span><span>x${pendingOrder.items[drinkId]}</span></div>`;
                    }
                }
            }
            const total = pendingOrder.priceDetails ? pendingOrder.priceDetails.total : 0;
            const prevPaid = pendingOrder.previouslyPaid || 0;
            const remaining = Math.max(0, total - prevPaid);
            
            let billTotalHtml = '';
            if (prevPaid > 0) {
                billTotalHtml = `
                    <div style="font-size: 0.8rem; color: var(--color-text-muted); display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                        <span>ยอดรวมบิล:</span><span>${total.toLocaleString()} บาท</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--color-success); display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                        <span>จ่ายแล้วก่อนหน้า:</span><span>${prevPaid.toLocaleString()} บาท</span>
                    </div>
                    <div class="table-bill-total" style="font-weight: 700; color: var(--color-warning); border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.3rem; margin-top: 0.3rem; display: flex; justify-content: space-between;">
                        <span>ยอดจ่ายเพิ่ม:</span><span>${remaining.toLocaleString()} บาท</span>
                    </div>
                `;
            } else {
                billTotalHtml = `
                    <div class="table-bill-total" style="display: flex; justify-content: space-between;"><span>ยอดค้างชำระ:</span><span>${total.toLocaleString()} บาท</span></div>
                `;
            }
            
            card.innerHTML = `
                <div class="table-header">
                    <div class="table-title text-warning"><i class="fa-solid fa-chair"></i> ${pendingOrder.customerName}</div>
                    <span class="table-status-badge badge-occupied"><i class="fa-solid fa-hourglass-half"></i> ค้างชำระ</span>
                </div>
                <div class="table-content">
                    <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.4rem;"><i class="fa-regular fa-clock"></i> บิลเวลา: ${pendingOrder.time}</div>
                    <div class="table-bill-items">${itemsHtml}</div>
                    ${billTotalHtml}
                </div>
                <div class="table-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-success btn-sm" onclick="payTableOrder('${pendingOrder.id}')" style="flex: 1.5; white-space: nowrap;">
                        <i class="fa-solid fa-money-bill-wave"></i> ชำระเงิน
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="loadOrderForEditing('${pendingOrder.id}')" style="flex: 1; white-space: nowrap;">
                        <i class="fa-solid fa-plus-minus"></i> สั่งเพิ่ม
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrder('${pendingOrder.id}')" style="flex: 1; white-space: nowrap;" title="ยกเลิกโต๊ะ / ลบออเดอร์">
                        <i class="fa-solid fa-trash-can"></i> ยกเลิกโต๊ะ
                    </button>
                </div>
            `;
        } else if (paidOrder) {
            // 🟢 STATE 2: มีคนนั่ง + จ่ายแล้ว
            card.className = 'table-card table-paid';
            let itemsHtml = '';
            if (paidOrder.items) {
                for (const drinkId in paidOrder.items) {
                    const drink = getDrinkById(drinkId);
                    if (drink) {
                        const batchSuffix = getBatchSuffix(drinkId);
                        itemsHtml += `<div class="table-bill-item"><span>${drink.nameTH}${batchSuffix}</span><span>x${paidOrder.items[drinkId]}</span></div>`;
                    }
                }
            }
            const total = paidOrder.priceDetails ? paidOrder.priceDetails.total : 0;
            const payIcon = paidOrder.paymentMethod === 'cash' ? '💵' : '📱';
            card.innerHTML = `
                <div class="table-header">
                    <div class="table-title text-success"><i class="fa-solid fa-chair"></i> ${paidOrder.customerName}</div>
                    <span class="table-status-badge badge-paid-seated"><i class="fa-solid fa-circle-check"></i> จ่ายแล้ว</span>
                </div>
                <div class="table-content">
                    <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.4rem;"><i class="fa-regular fa-clock"></i> บิลเวลา: ${paidOrder.time} &nbsp;${payIcon}</div>
                    <div class="table-bill-items">${itemsHtml}</div>
                    <div class="table-bill-total" style="color: var(--color-success);">
                        <span>จ่ายแล้ว:</span>
                        <span>${total.toLocaleString()} บาท ✓</span>
                    </div>
                    <div class="reopen-hint">
                        <i class="fa-solid fa-circle-info"></i> ลูกค้ายังนั่งอยู่ — กด “ต่อบิลเดิม” เพื่อเพิ่มรายการและคำนวณโปรโมชั่นรวม
                    </div>
                </div>
                <div class="table-actions table-actions-3">
                    <button class="btn btn-warning btn-sm" onclick="reopenPaidOrder('${paidOrder.id}')" style="flex:2;">
                        <i class="fa-solid fa-rotate-left"></i> ต่อบิลเดิม
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="openTable('${tableName}')" style="flex:1.5;">
                        <i class="fa-solid fa-cart-plus"></i> บิลใหม่
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="closeTableAfterPay('${tableName}')" style="flex:1.5;">
                        <i class="fa-solid fa-right-from-bracket"></i> ปิดโต๊ะ
                    </button>
                </div>
            `;
        } else {
            // ⚪ STATE 3: ว่าง
            card.className = 'table-card table-empty';
            card.innerHTML = `
                <div class="table-header">
                    <div class="table-title text-muted"><i class="fa-solid fa-chair"></i> ${tableName}</div>
                    <span class="table-status-badge badge-empty">ว่าง</span>
                </div>
                <div class="table-content" style="display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); font-style: italic; min-height: 80px;">
                    โต๊ะว่าง / พร้อมรับลูกค้า
                </div>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="openTable('${tableName}')">
                        <i class="fa-solid fa-cart-plus"></i> เปิดโต๊ะ
                    </button>
                </div>
            `;
        }
        gridContainer.appendChild(card);
    }

    
    // Render other pending orders (e.g. walkin or grab that are unpaid)
    const otherContainer = document.getElementById('other-pending-container');
    if (otherContainer) {
        otherContainer.innerHTML = '';
        
        const otherPendingOrders = state.orders.filter(o => {
            return !o.customerName.startsWith('โต๊ะ ') && (o.status === 'pending_promo' || o.status === 'unpaid');
        });
        
        if (otherPendingOrders.length === 0) {
            otherContainer.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--color-text-muted); font-style: italic; background: rgba(0,0,0,0.15); border: 1px dashed var(--border-glass); border-radius: var(--radius-md);">
                    ไม่มีออเดอร์ค้างชำระอื่นๆ
                </div>
            `;
        } else {
            otherPendingOrders.forEach(order => {
                const card = document.createElement('div');
                card.className = 'table-card table-occupied';
                
                let itemsHtml = '';
                for (const drinkId in order.items) {
                    const drink = getDrinkById(drinkId);
                    if (drink) {
                        const batchSuffix = getBatchSuffix(drinkId);
                        itemsHtml += `
                            <div class="table-bill-item">
                                <span>${drink.nameTH}${batchSuffix}</span>
                                <span>x${order.items[drinkId]}</span>
                            </div>
                        `;
                    }
                }
                
                const total = order.priceDetails ? order.priceDetails.total : 0;
                
                card.innerHTML = `
                    <div class="table-header">
                        <div class="table-title text-warning"><i class="fa-solid fa-receipt"></i> ${order.customerName}</div>
                        <span class="table-status-badge badge-occupied">ค้างชำระ</span>
                    </div>
                    <div class="table-content">
                        <div style="font-weight: 500; font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">ช่องทาง: ${order.deliveryType === 'grab' ? 'Grab' : 'หน้าร้าน'} | วันที่: ${order.date} (${order.time})</div>
                        <div class="table-bill-items">
                            ${itemsHtml}
                        </div>
                        <div class="table-bill-total">
                            <span>ยอดค้างชำระ:</span>
                            <span>${total.toLocaleString()} บาท</span>
                        </div>
                    </div>
                    <div class="table-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-success btn-sm" onclick="payTableOrder('${order.id}')" style="flex: 1.5; white-space: nowrap;">
                            <i class="fa-solid fa-money-bill-wave"></i> ชำระเงิน
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="loadOrderForEditing('${order.id}')" style="flex: 1; white-space: nowrap;">
                            <i class="fa-solid fa-plus-minus"></i> สั่งเพิ่ม
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteOrder('${order.id}')" style="flex: 1; white-space: nowrap;" title="ยกเลิกออเดอร์ / ลบออเดอร์">
                            <i class="fa-solid fa-trash-can"></i> ยกเลิก
                        </button>
                    </div>
                `;
                otherContainer.appendChild(card);
            });
        }
    }
}

// Open pay modal (replaces browser confirm)
function payTableOrder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    openPayModal(orderId);
}

function openPayModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    _payingOrderId = orderId;
    _payingMethod = 'scan';
    
    // Fill modal info
    document.getElementById('pay-modal-table-name').textContent = order.customerName;
    
    // Build items list
    let itemsHtml = '';
    if (order.items) {
        for (const drinkId in order.items) {
            const drink = getDrinkById(drinkId);
            if (drink) {
                const batchSuffix = getBatchSuffix(drinkId);
                itemsHtml += `<div class="pay-modal-item"><span>${drink.nameTH}${batchSuffix}</span><span>x${order.items[drinkId]}</span></div>`;
            }
        }
    }
    document.getElementById('pay-modal-items').innerHTML = itemsHtml;
    
    const total = order.priceDetails ? order.priceDetails.total : 0;
    const prevPaid = order.previouslyPaid || 0;
    const remaining = Math.max(0, total - prevPaid);
    
    const totalContainer = document.getElementById('pay-modal-total-container');
    if (prevPaid > 0) {
        totalContainer.style.flexDirection = 'column';
        totalContainer.style.alignItems = 'stretch';
        totalContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 0.25rem; width: 100%;">
                <span>ยอดรวมบิลนี้:</span>
                <span>${total.toLocaleString()} บาท</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--color-success); margin-bottom: 0.25rem; width: 100%;">
                <span>ชำระเงินแล้วก่อนหน้า:</span>
                <span>-${prevPaid.toLocaleString()} บาท</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 0.4rem; font-size: 1.1rem; font-weight: 800; color: var(--color-warning); width: 100%; align-items: center;">
                <span>ยอดชำระเพิ่ม:</span>
                <span class="pay-modal-amount" style="color: var(--color-warning); font-size: 1.6rem;">${remaining.toLocaleString()} บาท</span>
            </div>
        `;
    } else {
        totalContainer.style.flexDirection = 'row';
        totalContainer.style.alignItems = 'center';
        totalContainer.innerHTML = `
            <span>ยอดชำระรวม</span>
            <span class="pay-modal-amount" id="pay-modal-amount">${total.toLocaleString()} บาท</span>
        `;
    }
    
    // Reset method buttons
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('pay-method-scan').classList.add('selected');
    
    document.getElementById('pay-modal').classList.add('active');
}

function selectPayMethod(method) {
    _payingMethod = method;
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('selected'));
    const btn = document.getElementById(`pay-method-${method}`);
    if (btn) btn.classList.add('selected');
}

function confirmPayment() {
    if (!_payingOrderId) return;
    
    const order = state.orders.find(o => o.id === _payingOrderId);
    if (!order) return;
    
    order.status = 'paid';
    order.paymentMethod = _payingMethod;
    order.previouslyPaid = order.priceDetails ? order.priceDetails.total : 0;
    order.updatedTime = new Date().toISOString();
    
    saveToLocalStorage();
    
    document.getElementById('pay-modal').classList.remove('active');
    _payingOrderId = null;
    
    // Refresh
    renderTables();
    renderOrders();
    renderAnalytics();
}

// Reopen a paid order back to pending so more items can be added (for promo completion)
function reopenPaidOrder(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Revert status back to pending
    order.status = 'pending_promo';
    order.tableClosed = false;
    order.updatedTime = new Date().toISOString();
    
    saveToLocalStorage();
    
    // Load into POS form for editing (loads existing items into cart)
    loadOrderForEditing(orderId);
    
    // Count existing bottles to show in UI
    const existingQty = Object.values(order.items || {}).reduce((a, b) => a + b, 0);
    
    // Override title and save button for clarity
    document.getElementById('pos-title').innerHTML =
        '<i class="fa-solid fa-rotate-left text-warning"></i> ' +
        'ต่อบิล: ' + order.customerName +
        ' <span style="font-size:0.8rem;color:var(--color-warning);font-weight:500;">— เดิม ' + existingQty + ' ขวด, เพิ่มได้เลย</span>';
    document.getElementById('order-status').value = 'pending_promo';
    document.getElementById('btn-save-order').innerHTML =
        '<i class="fa-solid fa-rotate-left"></i> บันทึกบิลต่อเนื่อง';
    
    // Refresh tables view
    renderTables();
    renderOrders();
    
    // Scroll to POS
    const posPanel = document.querySelector('.pos-panel');
    if (posPanel) posPanel.scrollIntoView({ behavior: 'smooth' });
}

// Close table after payment
function closeTableAfterPay(tableName) {
    const todayStr = getLocalDateString(new Date());
    // Find the latest paid order for this table today and mark it as 'closed'
    const paidOrders = state.orders.filter(o =>
        (o.customerName === tableName || o.customerName.startsWith(tableName + ' (')) &&
        o.date === todayStr && o.status === 'paid'
    );
    paidOrders.forEach(o => { o.tableClosed = true; });
    saveToLocalStorage();
    renderTables();
    renderOrders();
}

// Open table helper
function openTable(tableName) {
    document.getElementById('customer-name').value = tableName;
    document.getElementById('customer-display-name').value = '';
    // Auto-set delivery type hidden field
    const deliveryInput = document.getElementById('delivery-type');
    if (deliveryInput) deliveryInput.value = 'walkin';
    // Auto-set staff from session
    const staffInput = document.getElementById('staff-name');
    if (staffInput) staffInput.value = sessionStorage.getItem('baanphuan_username') || '';
    // Auto-set date to today
    const dateInput = document.getElementById('order-date');
    if (dateInput) dateInput.value = getLocalDateString(new Date());
    
    document.getElementById('order-status').value = 'pending_promo';
    
    // Clear cart since it's a new opening
    state.cart = {};
    renderDrinkGrid();
    renderCart();
    
    // Update POS Header to show table opening mode
    document.getElementById('pos-title').innerHTML = `<i class="fa-solid fa-cart-plus text-primary"></i> เปิดโต๊ะ: ${tableName}`;
    
    // Scroll to POS Form
    document.querySelector('.pos-panel').scrollIntoView({ behavior: 'smooth' });
}

// UPDATE CANCEL TABLE BUTTON VISIBILITY
function updateCancelTableButtonVisibility() {
    const customerSelect = document.getElementById('customer-name');
    const cancelBtn = document.getElementById('btn-cancel-table');
    if (!customerSelect || !cancelBtn) return;
    
    const selectedVal = customerSelect.value;
    const activeDate = document.getElementById('order-date').value;
    
    const isTable = selectedVal && selectedVal.startsWith('โต๊ะ ');
    if (isTable) {
        // Check if there are orders for this table on this date
        const tableOrders = state.orders.filter(o => 
            (o.customerName === selectedVal || o.customerName.startsWith(selectedVal + ' (')) && 
            o.date === activeDate && !o.tableClosed
        );
        if (tableOrders.length > 0) {
            cancelBtn.style.display = 'inline-flex';
            return;
        }
    }
    
    cancelBtn.style.display = 'none';
}

// CUSTOMER VIEW RENDERING
function renderCustomerView() {
    const container = document.getElementById('customer-beverages-container');
    if (!container) return;
    container.innerHTML = '';
    
    DRINKS.forEach(drink => {
        const availableOld = state.stock[drink.id + '_old'] !== undefined ? state.stock[drink.id + '_old'] : 20;
        const availableNew = state.stock[drink.id + '_new'] !== undefined ? state.stock[drink.id + '_new'] : 0;
        const available = availableOld + availableNew;
        
        let badgeHtml = '';
        let cardStatusClass = '';
        
        if (available === 0) {
            badgeHtml = `<span class="customer-drink-stock-badge out-of-stock">หมดชั่วคราว</span>`;
            cardStatusClass = 'out-of-stock';
        } else if (available <= 5) {
            badgeHtml = `<span class="customer-drink-stock-badge low-stock">ใกล้หมด: เหลือ ${available} ขวด</span>`;
        } else {
            badgeHtml = `<span class="customer-drink-stock-badge in-stock">คงเหลือ: ${available} ขวด</span>`;
        }
        
        const card = document.createElement('div');
        card.className = `customer-drink-card ${cardStatusClass}`;
        card.style = `--drink-color: ${drink.color}; --drink-glow: rgba(${drink.colorRgb}, 0.25);`;
        
        card.innerHTML = `
            <div class="customer-drink-card-icon" style="background: rgba(${drink.colorRgb}, 0.1); color: ${drink.color};">
                <i class="fa-solid ${drink.icon}"></i>
            </div>
            <div class="customer-drink-card-info">
                <h4>${drink.nameTH}</h4>
                <p>${drink.nameEN}</p>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem;">สีฝา: ${drink.capColor}</div>
            </div>
            ${badgeHtml}
        `;
        container.appendChild(card);
    });
}

// SEARCH CUSTOMER INCOMPLETE PROMOS / UNPAID BILLS
function searchCustomerStatus() {
    const inputEl = document.getElementById('customer-search-input');
    const resultsEl = document.getElementById('customer-search-results');
    if (!inputEl || !resultsEl) return;
    
    const query = inputEl.value.trim().toLowerCase();
    if (!query) {
        resultsEl.innerHTML = '<div class="text-center text-muted py-4">กรุณากรอกชื่อลูกค้าหรือเบอร์โต๊ะเพื่อค้นหา</div>';
        return;
    }
    
    const matchingOrders = state.orders.filter(o => {
        const nameMatch = o.customerName.toLowerCase().includes(query);
        const isPending = o.status === 'pending_promo' || o.status === 'unpaid';
        return nameMatch && isPending;
    });
    
    if (matchingOrders.length === 0) {
        resultsEl.innerHTML = `
            <div class="card" style="padding: 1.5rem; text-align: center; border: 1px dashed var(--border-glass); border-radius: var(--radius-md); background: #ffffff;">
                <i class="fa-solid fa-circle-question text-muted" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--color-text-muted);"></i>
                <p style="font-weight: 500;">ไม่พบยอดค้างโปรหรือยอดค้างชำระของ "${inputEl.value}"</p>
                <p style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.25rem;">หากแน่ใจว่ามียอดค้างชำระ กรุณาสอบถามพนักงานที่หน้าร้าน</p>
            </div>
        `;
        return;
    }
    
    matchingOrders.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    
    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    
    matchingOrders.forEach(order => {
        let itemsText = [];
        for (const drinkId in order.items) {
            const qty = order.items[drinkId];
            const drink = getDrinkById(drinkId);
            const batchSuffix = getBatchSuffix(drinkId);
            const name = drink ? `${drink.nameTH}${batchSuffix}` : drinkId;
            itemsText.push(`${name} x${qty} ขวด`);
        }
        const itemsHtml = itemsText.join(', ');
        
        const total = order.priceDetails ? order.priceDetails.total : 0;
        const prevPaid = order.previouslyPaid || 0;
        const remaining = Math.max(0, total - prevPaid);
        
        let statusBadge = '';
        let detailHtml = '';
        
        if (order.status === 'pending_promo') {
            statusBadge = `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.1); color: var(--color-warning); border: 1px solid var(--color-warning); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600;"><i class="fa-solid fa-hourglass-half"></i> ค้างโปรโมชั่น</span>`;
            detailHtml = `
                <div style="font-size: 0.9rem; margin-top: 0.5rem; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 0.5rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                        <span>ชำระเงินมัดจำโปรแล้ว:</span><strong>${prevPaid.toLocaleString()} บาท</strong>
                    </div>
                    <div style="font-size:0.85rem; color:var(--color-success); margin-top: 0.35rem;">
                        <i class="fa-solid fa-circle-info"></i> ลูกค้าสามารถมารับเครื่องดื่มที่เหลือได้ที่หน้าร้าน
                    </div>
                </div>
            `;
        } else if (order.status === 'unpaid') {
            statusBadge = `<span class="badge badge-danger" style="background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border: 1px solid var(--color-danger); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600;"><i class="fa-solid fa-circle-xmark"></i> ค้างชำระเงิน</span>`;
            
            if (prevPaid > 0) {
                detailHtml = `
                    <div style="font-size: 0.9rem; margin-top: 0.5rem; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 0.5rem;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                            <span>ยอดรวมทั้งหมด:</span><span>${total.toLocaleString()} บาท</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem; color:var(--color-success);">
                            <span>ชำระแล้วบางส่วน:</span><span>-${prevPaid.toLocaleString()} บาท</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--color-danger);">
                            <span>ยอดค้างชำระเพิ่ม:</span><span>${remaining.toLocaleString()} บาท</span>
                        </div>
                    </div>
                `;
            } else {
                detailHtml = `
                    <div style="font-size: 0.9rem; margin-top: 0.5rem; border-top: 1px dashed rgba(0,0,0,0.05); padding-top: 0.5rem;">
                        <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--color-danger);">
                            <span>ยอดค้างชำระทั้งหมด:</span><span>${total.toLocaleString()} บาท</span>
                        </div>
                    </div>
                `;
            }
        }
        
        html += `
            <div class="card" style="padding: 1.25rem; border: 1px solid var(--border-glass); border-radius: var(--radius-md); background: #ffffff; box-shadow: var(--shadow-sm); text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <div>
                        <h3 style="font-size: 1.1rem; color: var(--color-primary); margin: 0;">${order.customerName}</h3>
                        <span style="font-size: 0.75rem; color: var(--color-text-muted);"><i class="fa-regular fa-clock"></i> บันทึกเมื่อ: ${order.date} ${order.time || ''}</span>
                    </div>
                    ${statusBadge}
                </div>
                <div style="font-size: 0.9rem; color: var(--color-text); margin-top: 0.5rem;">
                    <strong>รายการเครื่องดื่ม:</strong> ${itemsHtml}
                </div>
                ${detailHtml}
                ${order.remark ? `<div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.5rem; background: #f8fafc; padding: 0.35rem 0.5rem; border-radius: var(--radius-sm);">หมายเหตุ: ${order.remark}</div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    resultsEl.innerHTML = html;
}

// RENDER PROMO TAB CONTENT (ADMIN)
function renderPromoTab() {
    const container = document.getElementById('promo-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    const filterStatus = document.getElementById('filter-promo-status').value;
    const searchQuery = document.getElementById('search-promo-customer').value.trim().toLowerCase();
    
    let filtered = state.orders.filter(order => {
        const isPending = order.status === 'pending_promo' || order.status === 'unpaid';
        if (!isPending) return false;
        
        if (filterStatus !== 'all' && order.status !== filterStatus) return false;
        if (searchQuery && !order.customerName.toLowerCase().includes(searchQuery)) return false;
        
        return true;
    });
    
    filtered.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted" style="padding: 2.5rem 1rem;">ไม่พบรายการค้างโปรโมชั่นหรือค้างจ่าย</td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(order => {
        let itemsText = [];
        let totalBottles = 0;
        for (const drinkId in order.items) {
            const qty = order.items[drinkId];
            totalBottles += qty;
            const drink = getDrinkById(drinkId);
            const batchSuffix = getBatchSuffix(drinkId);
            const name = drink ? `${drink.nameTH}${batchSuffix}` : drinkId;
            itemsText.push(`${name} x${qty}`);
        }
        const itemsHtml = itemsText.join('<br>');
        
        const total = order.priceDetails ? order.priceDetails.total : 0;
        const prevPaid = order.previouslyPaid || 0;
        const remaining = Math.max(0, total - prevPaid);
        
        let statusBadge = '';
        if (order.status === 'pending_promo') {
            statusBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--color-warning); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem;"><i class="fa-solid fa-hourglass-half"></i> ค้างโปร</span>`;
        } else if (order.status === 'unpaid') {
            statusBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--color-danger); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.8rem;"><i class="fa-solid fa-circle-xmark"></i> ค้างจ่าย</span>`;
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight: 500;">${order.date}</div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">${order.time || ''}</div>
            </td>
            <td>
                <div style="font-weight: 600; color: var(--color-primary);">${order.customerName}</div>
                ${order.remark ? `<div style="font-size: 0.75rem; color: var(--color-text-muted); font-style: italic;">หมายเหตุ: ${order.remark}</div>` : ''}
            </td>
            <td style="font-size: 0.85rem; line-height: 1.3; padding: 0.5rem 0.75rem;">${itemsHtml}</td>
            <td style="text-align: center; font-weight: 600;">${totalBottles} ขวด</td>
            <td style="text-align: right;">${total.toLocaleString()} บ.</td>
            <td style="text-align: right; color: var(--color-success); font-weight: 500;">${prevPaid.toLocaleString()} บ.</td>
            <td style="text-align: right; color: ${remaining > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'}; font-weight: 600;">${remaining.toLocaleString()} บ.</td>
            <td style="text-align: center;">${statusBadge}</td>
            <td style="text-align: center; padding: 0.5rem 0.75rem;">
                <div style="display: flex; gap: 0.35rem; justify-content: center; flex-wrap: wrap;">
                    ${remaining > 0 ? `
                        <button class="btn btn-success btn-xs" onclick="openPaymentModal('${order.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="ชำระเงินส่วนที่เหลือ">
                            <i class="fa-solid fa-check"></i> ชำระเงิน
                        </button>
                    ` : `
                        <button class="btn btn-outline btn-xs" onclick="toggleOrderStatus('${order.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="ทำเป็นจ่ายแล้ว">
                            <i class="fa-solid fa-arrows-spin"></i> ปิดโปร
                        </button>
                    `}
                    <button class="btn btn-secondary btn-xs" onclick="loadOrderForEditing('${order.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="แก้ไขออเดอร์ (สั่งน้ำเพิ่ม/เปลี่ยน)">
                        <i class="fa-solid fa-pen-to-square"></i> แก้ไข
                    </button>
                    <button class="btn btn-outline btn-xs" onclick="copyOrderToText('${order.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="คัดลอกข้อความแชร์">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(tr);
    });
}

// RUN ON LOAD
window.onload = init;
