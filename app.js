// DRINK DATABASE
const DRINKS = [
    { id: 'oishi', nameTH: 'โออิชิ', nameEN: 'Oishi', category: 'tea', color: '#8FA87B', colorRgb: '143, 168, 123', icon: 'fa-leaf', capColor: 'น้ำเงิน' },
    { id: 'grape', nameTH: 'องุ่นเคียวโฮ', nameEN: 'Kyoho Grape', category: 'fruit', color: '#A28AA8', colorRgb: '162, 138, 168', icon: 'fa-wine-glass', capColor: 'ขาว' },
    { id: 'bitter', nameTH: 'เดิมขม', nameEN: 'Original Bitter', category: 'dark', color: '#7E8578', colorRgb: '126, 133, 120', icon: 'fa-mug-hot', capColor: 'ดำ' },
    { id: 'sweet', nameTH: 'เดิมหวาน', nameEN: 'Original Sweet', category: 'amber', color: '#DDB87B', colorRgb: '221, 184, 123', icon: 'fa-cookie', capColor: 'แดง' },
    { id: 'honey-lemon', nameTH: 'น้ำผึ้งมะนาว', nameEN: 'Honey Lemon', category: 'yellow', color: '#E0C068', colorRgb: '224, 192, 104', icon: 'fa-lemon', capColor: 'ม่วง' },
    { id: 'blueberry', nameTH: 'บลูเบอร์รี่', nameEN: 'Blueberry', category: 'fruit', color: '#7B94B8', colorRgb: '123, 148, 184', icon: 'fa-seedling', capColor: 'ฟ้า' },
    { id: 'yogurt', nameTH: 'โยเกิร์ต', nameEN: 'Yogurt', category: 'yogurt', color: '#D2A0A8', colorRgb: '210, 160, 168', icon: 'fa-cheese', capColor: 'เหลือง' },
    { id: 'strawberry-yogurt', nameTH: 'โยเกิร์ตสตอเบอรี่', nameEN: 'Strawberry Yogurt', category: 'yogurt', color: '#D48A92', colorRgb: '212, 138, 146', icon: 'fa-ice-cream', capColor: 'ชมพู' },
    { id: 'strawberry', nameTH: 'สตอเบอรี่', nameEN: 'Strawberry', category: 'fruit', color: '#D96B6B', colorRgb: '217, 107, 107', icon: 'fa-apple-whole', capColor: 'ฟ้า' },
    { id: 'apple', nameTH: 'แอปเปิ้ล', nameEN: 'Apple', category: 'fruit', color: '#CE7B7B', colorRgb: '206, 123, 123', icon: 'fa-apple-whole', capColor: 'เหลือง' },
    { id: 'greentea', nameTH: 'ชาเขียว', nameEN: 'Green Tea', category: 'tea', color: '#7CA682', colorRgb: '124, 166, 130', icon: 'fa-mug-hot', capColor: 'แดง' },
    { id: 'taro', nameTH: 'เผือก', nameEN: 'Taro', category: 'yogurt', color: '#B0A2C7', colorRgb: '176, 162, 199', icon: 'fa-egg', capColor: 'ม่วง' },
    { id: 'cocoa', nameTH: 'โกโก้', nameEN: 'Cocoa', category: 'cocoa', color: '#9C7C60', colorRgb: '156, 124, 96', icon: 'fa-mug-hot', capColor: 'แดง' },
    { id: 'watermelon', nameTH: 'แตงโม', nameEN: 'Watermelon', category: 'fruit', color: '#DF8A8E', colorRgb: '223, 138, 142', icon: 'fa-lemon', capColor: 'ดำ' }
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

// STATE MANAGEMENT
let state = {
    orders: [],
    grabPickups: [],
    editingOrderId: null,
    cart: {}, // drinkId -> quantity
    searchQuery: '',
    tab: 'tables-tab',
    sheetUrl: '',
    autoSync: false,
    stock: {}, // drinkId -> quantity
    users: []
};

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
    
    // Load Google Sheets configurations (default URL and auto-sync enabled by default)
    const defaultUrl = 'https://script.google.com/macros/s/AKfycbz84s4EmEOUcmxKbxnR9Pfbf3evnqldYgAQ2qmsuEjo9TdJ30K8Bb1nGQvfKoO2b76u/exec';
    state.sheetUrl = localStorage.getItem('juice_bar_sheet_url') || defaultUrl;
    
    const savedAutoSync = localStorage.getItem('juice_bar_auto_sync');
    state.autoSync = savedAutoSync !== null ? savedAutoSync === 'true' : true;
    
    // Ensure default config is stored in localStorage
    localStorage.setItem('juice_bar_sheet_url', state.sheetUrl);
    localStorage.setItem('juice_bar_auto_sync', state.autoSync ? 'true' : 'false');
    
    // Populate Google Sheets UI inputs & staff name
    document.getElementById('sheet-url-input').value = state.sheetUrl;
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
    
    // Auto-pull from sheet on startup if URL is configured
    if (state.sheetUrl) {
        pullFromSheets(true);
    }
}

// CHECK LOGIN STATUS
function checkLoginStatus() {
    const loggedIn = sessionStorage.getItem('baanphuan_logged_in') === 'true';
    const loginContainer = document.getElementById('login-container');
    const adminTabBtn = document.getElementById('tab-btn-admin');
    if (loggedIn) {
        if (loginContainer) loginContainer.classList.add('hidden');
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
        if (loginContainer) loginContainer.classList.remove('hidden');
        document.getElementById('header-user-badge').style.display = 'none';
        if (adminTabBtn) adminTabBtn.style.display = 'none';
        switchTab('tables-tab');
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

// SAVE USERS TO LOCAL STORAGE
function saveUsersToLocalStorage(skipSync = false) {
    localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
    
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
            let url = state.sheetUrl || '';
            const newUrl = prompt("ระบุ Google Apps Script Web App URL:", url);
            if (newUrl === null) return; // User cancelled
            
            const trimmedUrl = newUrl.trim();
            if (!trimmedUrl) {
                alert("กรุณาระบุ URL ที่ถูกต้อง");
                return;
            }
            
            state.sheetUrl = trimmedUrl;
            saveToLocalStorage(true);
            
            const originalText = btnLoginPullSheet.innerHTML;
            btnLoginPullSheet.disabled = true;
            btnLoginPullSheet.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังซิงค์ข้อมูล...';
            
            try {
                await pullFromSheets(true);
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
    if (latestOrder.status === 'pending_promo') {
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
                <span class="bev-cap-color" style="font-size: 0.7rem; color: var(--color-text-muted); display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; margin-top: 0.2rem; background: rgba(29, 78, 216, 0.05); padding: 0.1rem 0.5rem; border-radius: 50px; border: 1px solid var(--border-glass); user-select: none;">
                    <i class="fa-solid fa-circle" style="color: ${CAP_COLORS_MAP[drink.capColor] || '#ccc'}; font-size: 0.6rem; filter: drop-shadow(0 0 2px ${CAP_COLORS_MAP[drink.capColor] || '#ccc'}); ${drink.capColor === 'ขาว' ? 'border: 1px solid #94a3b8; border-radius: 50%;' : ''}"></i>
                    ฝา${drink.capColor}
                </span>
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
    
    const isGrab = document.getElementById('delivery-type').value === 'grab';
    const currentPricePerBottle = isGrab ? 67.90 : 80;

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
    
    // Save last used staff name to remember it
    if (staffName) {
        localStorage.setItem('juice_bar_last_staff', staffName);
    }
    
    const totalQty = Object.values(state.cart).reduce((a, b) => a + b, 0);
    // Grab pricing is 67.90 per bottle, normal is 80 per bottle
    const pricing = calculateBestPrice(totalQty, deliveryType === 'grab');
    
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
        if (o.status === 'pending_promo') return;
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
        const statusBadge = order.status === 'pending_promo' 
            ? `<span class="badge" style="background-color: #ef4444; color: white;"><i class="fa-solid fa-hourglass-half"></i> ยังไม่ครบโปร</span>`
            : `<span class="badge" style="background-color: #22c55e; color: white;"><i class="fa-solid fa-circle-check"></i> ครบโปร / จ่ายแล้ว</span>`;
        
        // Payment Badge
        let paymentBadge = '';
        if (order.paymentMethod === 'cash') {
            paymentBadge = `<span class="badge" style="background-color: #0ea5e9; color: white;"><i class="fa-solid fa-money-bill-wave"></i> เงินสด</span>`;
        } else if (order.paymentMethod === 'scan') {
            paymentBadge = `<span class="badge" style="background-color: #6366f1; color: white;"><i class="fa-solid fa-qrcode"></i> โอน/สแกน</span>`;
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
            const drink = DRINKS.find(d => d.id === drinkId);
            if (drink) {
                drinkBadgesHTML += `
                    <div class="order-item-badge" style="--bev-color: ${drink.color};" title="ฝาสี${drink.capColor}">
                        <span>${drink.nameTH} <span style="font-size: 0.7rem; opacity: 0.75; font-weight: normal;">(${drink.capColor})</span></span>
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
                        <i class="fa-solid fa-arrows-spin"></i> ${order.status === 'pending_promo' ? 'ทำเป็นครบโปร' : 'ทำเป็นยังไม่ครบ'}
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
        if (order.status === 'pending_promo') return;
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
            } else {
                filteredScanRevenue += pricing.total || 0;
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
                    if (popTracker.hasOwnProperty(drinkId)) {
                        popTracker[drinkId] += order.items[drinkId];
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
                    if (popTracker.hasOwnProperty(drinkId)) {
                        popTracker[drinkId] += grab.items[drinkId];
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
        payDetailsEl.textContent = `โอน/สแกน: ${filteredScanRevenue.toLocaleString()} บาท | เงินสด: ${filteredCashRevenue.toLocaleString()} บาท`;
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
            const drink = DRINKS.find(d => d.id === id);
            return {
                id: id,
                nameTH: drink ? drink.nameTH : id,
                qty: popTracker[id]
            };
        })
        .sort((a, b) => b.qty - a.qty);
        
    const popularContainer = document.getElementById('popular-drinks-list');
    
    const maxQty = sortedPopular.length > 0 ? sortedPopular[0].qty : 0;
    
    if (maxQty === 0) {
        popularContainer.innerHTML = `<div class="text-muted text-center py-4">ยังไม่มีข้อมูลยอดขายช่วงนี้</div>`;
        return;
    }
    
    popularContainer.innerHTML = sortedPopular.map((item, idx) => {
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
        if (data && (data.orders || data.grabPickups || data.stock || data.users)) {
            state.orders = data.orders || [];
            state.grabPickups = data.grabPickups || [];
            state.stock = data.stock || {};
            
            // Sync users if present
            if (data.users && Array.isArray(data.users) && data.users.length > 0) {
                state.users = data.users;
                localStorage.setItem('juice_bar_users', JSON.stringify(state.users));
                renderLoginUserDropdown();
                renderAdminUsersList();
            }
            
            // Ensure all drinks in database have a stock quantity (default to 20 if not set)
            DRINKS.forEach(drink => {
                if (state.stock[drink.id] === undefined) {
                    state.stock[drink.id] = 20;
                }
            });
            
            // Save to LocalStorage skipping the auto-push sync loop
            saveToLocalStorage(true);
            
            // Refresh POS UI
            renderTables();
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
            throw new Error("ไม่พบข้อมูล หรือรูปแบบข้อมูลในชีตไม่ถูกต้อง");
        }
    } catch (err) {
        console.error("Failed to pull from Google Sheets:", err);
        if (!isSilent) {
            alert("ดึงข้อมูลล้มเหลว: " + err.message + "\n\nกรุณาตรวจสอบว่า:\n1. ลิงก์ URL ถูกต้อง\n2. ตั้งค่า Deploy ใน Apps Script เป็นแบบ 'Anyone' (ทุกคน)\n3. บัญชีที่ใช้เปิดสิทธิ์เข้าถึงสาธารณะเรียบร้อยแล้ว");
        }
        throw err;
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
        const payloadObj = {
            action: 'save',
            data: {
                orders: state.orders,
                grabPickups: state.grabPickups,
                stock: state.stock,
                users: state.users
            }
        };
        
        // Use POST method to bypass URL length limitation
        const response = await fetch(state.sheetUrl, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payloadObj)
        });
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
                        <strong style="color: var(--color-text);">${drink.nameTH}</strong>
                        <div style="font-size: 0.75rem; color: var(--color-text-muted);">${drink.nameEN}</div>
                    </div>
                </div>
            </td>
            <td style="text-align: center;">
                <span id="stock-val-display-${drink.id}" style="font-size: 1.1rem; font-weight: 700; color: var(--color-text);">${qty}</span>
            </td>
            <td style="text-align: center;">${statusBadge}</td>
            <td>
                <div class="stock-qty-control" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                    <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" onclick="adjustStockValue('${drink.id}', -5)">-5</button>
                    <button class="btn btn-outline btn-sm" style="padding: 0.25rem 0.5rem;" onclick="adjustStockValue('${drink.id}', -1)">-1</button>
                    <input type="number" id="stock-input-${drink.id}" value="${qty}" min="0" style="width: 55px; text-align: center; font-weight: bold; background: rgba(255, 255, 255, 0.85); border: 1px solid var(--border-glass); color: var(--color-text); padding: 0.25rem 0.4rem; border-radius: var(--radius-sm);" onchange="updateStockFromInput('${drink.id}', this.value)">
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
                    if (order.status === 'pending_promo') return;
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
    const payMethodName = order.paymentMethod === 'cash' ? 'เงินสด' : 'เงินโอน / สแกน';
    
    let itemsText = '';
    const drinkKeys = Object.keys(order.items);
    drinkKeys.forEach(drinkId => {
        const drink = DRINKS.find(d => d.id === drinkId);
        if (drink) {
            itemsText += `• ${drink.nameTH} (${drink.nameEN}) x${order.items[drinkId]} ขวด\n`;
        }
    });
    
    const isPendingPromo = order.status === 'pending_promo';
    const totalQty = Object.values(order.items).reduce((a, b) => a + b, 0);
    const netTotal = isPendingPromo ? 0 : (order.priceDetails ? order.priceDetails.total : 0);
    const discountText = (!isPendingPromo && order.priceDetails && order.priceDetails.discount > 0) ? ` (ประหยัดโปรโมชั่นไป ${order.priceDetails.discount} บ.)` : '';
    const pendingNote = isPendingPromo ? ' (ยังไม่ครบโปร)' : '';
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
                } else {
                    filteredScanRevenue += pricing.total || 0;
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
   • เงินสด: ${filteredCashRevenue.toLocaleString()} บาท
---------------------------------
⚠️ รายชื่อลูกค้าที่ยังไม่ครบโปร:
${pendingText}---------------------------------`;

    copyToClipboard(summaryText, `คัดลอกสรุปยอดขาย (${targetDateText}) เรียบร้อยแล้ว!`);
}

// TOGGLE ORDER PROMO STATUS
function toggleOrderStatus(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;
    
    order.status = order.status === 'pending_promo' ? 'paid' : 'pending_promo';
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
    
    const totalTables = 8;
    const todayStr = getLocalDateString(new Date());
    
    // ─── Update Live Stats ───
    let occupiedCount = 0;  // pending (ค้างชำระ)
    let paidSeatedCount = 0; // paid but still seated
    let emptyCount = 0;
    let pendingTotal = 0;
    let todayRevenue = 0;
    
    state.orders.forEach(o => {
        if (o.date === todayStr && o.status !== 'pending_promo') {
            todayRevenue += (o.priceDetails ? o.priceDetails.total : 0);
        }
        if (o.status === 'pending_promo' && o.customerName && o.customerName.startsWith('โต๊ะ ')) {
            pendingTotal += (o.priceDetails ? o.priceDetails.total : 0);
        }
    });
    
    for (let i = 1; i <= totalTables; i++) {
        const tableName = `โต๊ะ ${i}`;
        const hasPending = state.orders.some(o =>
            (o.customerName === tableName || o.customerName.startsWith(tableName + ' (')) &&
            o.date === todayStr && o.status === 'pending_promo'
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
            o.date === todayStr && o.status === 'pending_promo'
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
                    const drink = DRINKS.find(d => d.id === drinkId);
                    if (drink) itemsHtml += `<div class="table-bill-item"><span>${drink.nameTH}</span><span>x${pendingOrder.items[drinkId]}</span></div>`;
                }
            }
            const total = pendingOrder.priceDetails ? pendingOrder.priceDetails.total : 0;
            card.innerHTML = `
                <div class="table-header">
                    <div class="table-title text-warning"><i class="fa-solid fa-chair"></i> ${pendingOrder.customerName}</div>
                    <span class="table-status-badge badge-occupied"><i class="fa-solid fa-hourglass-half"></i> ค้างชำระ</span>
                </div>
                <div class="table-content">
                    <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.4rem;"><i class="fa-regular fa-clock"></i> บิลเวลา: ${pendingOrder.time}</div>
                    <div class="table-bill-items">${itemsHtml}</div>
                    <div class="table-bill-total"><span>ยอดค้างชำระ:</span><span>${total.toLocaleString()} บาท</span></div>
                </div>
                <div class="table-actions">
                    <button class="btn btn-success btn-sm" onclick="payTableOrder('${pendingOrder.id}')">
                        <i class="fa-solid fa-money-bill-wave"></i> ชำระเงิน
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="loadOrderForEditing('${pendingOrder.id}')">
                        <i class="fa-solid fa-plus-minus"></i> สั่งเพิ่ม
                    </button>
                </div>
            `;
        } else if (paidOrder) {
            // 🟢 STATE 2: มีคนนั่ง + จ่ายแล้ว
            card.className = 'table-card table-paid';
            let itemsHtml = '';
            if (paidOrder.items) {
                for (const drinkId in paidOrder.items) {
                    const drink = DRINKS.find(d => d.id === drinkId);
                    if (drink) itemsHtml += `<div class="table-bill-item"><span>${drink.nameTH}</span><span>x${paidOrder.items[drinkId]}</span></div>`;
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
            return !o.customerName.startsWith('โต๊ะ ') && o.status === 'pending_promo';
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
                    const drink = DRINKS.find(d => d.id === drinkId);
                    if (drink) {
                        itemsHtml += `
                            <div class="table-bill-item">
                                <span>${drink.nameTH}</span>
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
                    <div class="table-actions">
                        <button class="btn btn-success btn-sm" onclick="payTableOrder('${order.id}')">
                            <i class="fa-solid fa-money-bill-wave"></i> ชำระเงิน
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="loadOrderForEditing('${order.id}')">
                            <i class="fa-solid fa-plus-minus"></i> สั่งเพิ่ม
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
            const drink = DRINKS.find(d => d.id === drinkId);
            if (drink) {
                itemsHtml += `<div class="pay-modal-item"><span>${drink.nameTH}</span><span>x${order.items[drinkId]}</span></div>`;
            }
        }
    }
    document.getElementById('pay-modal-items').innerHTML = itemsHtml;
    
    const total = order.priceDetails ? order.priceDetails.total : 0;
    document.getElementById('pay-modal-amount').textContent = `${total.toLocaleString()} บาท`;
    
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
    
    // Load into POS form for editing
    loadOrderForEditing(orderId);
    
    // Refresh tables view
    renderTables();
    renderOrders();
    
    // Scroll to POS
    const posPanel = document.querySelector('.pos-panel');
    if (posPanel) posPanel.scrollIntoView({ behavior: 'smooth' });
    
    // Update POS title to indicate continuation
    const title = document.getElementById('pos-title');
    if (title) title.innerHTML = `<i class="fa-solid fa-rotate-left text-warning"></i> ต่อบิลเดิม: ${order.customerName}`;
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

// RUN ON LOAD
window.onload = init;
