// ==================== CONFIGURATION ====================
// ทางเลือกที่ 1: LINE OA Messaging API (ฟรีตามลิมิตของ LINE)
// นำ Channel Access Token และ Target ID (User ID หรือ Group ID) มากรอกที่นี่
var LINE_OA_ACCESS_TOKEN = ""; 
var LINE_OA_TARGET_ID = "";    

// ทางเลือกที่ 2: Discord Webhook (แนะนำ! ฟรี 100% ไม่จำกัดจำนวนข้อความ)
// นำ Webhook URL ของห้อง Discord มากรอกที่นี่
var DISCORD_WEBHOOK_URL = "";

// ทางเลือกที่ 3: Telegram Bot API (ฟรี 100% ไม่จำกัดจำนวนข้อความ)
// นำ Bot Token และ Chat ID มากรอกที่นี่
var TELEGRAM_BOT_TOKEN = "";
var TELEGRAM_CHAT_ID = "";
// =======================================================

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;
  
  if (action === 'save') {
    try {
      var dataStr = e.parameter.data;
      var payload = JSON.parse(decodeURIComponent(dataStr));
      return saveData(ss, payload);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else {
    // Default action: Pull/Read data
    try {
      var systemSheet = ss.getSheetByName("SystemState");
      var stateData = { orders: [], grabPickups: [], stock: {} };
      if (systemSheet) {
        var cellVal = systemSheet.getRange(1, 1).getValue();
        if (cellVal) {
          var parsedCell = JSON.parse(cellVal);
          // Handle new format with notifiedIds
          if (parsedCell.state) {
            stateData = parsedCell.state;
          } else {
            stateData = parsedCell;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(stateData))
        .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = JSON.parse(e.postData.contents);
    
    // Check if it is a LINE Webhook event payload
    if (postData.events && Array.isArray(postData.events)) {
      handleLineWebhook(ss, postData.events);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Standard POS save action
    var action = postData.action;
    var payload = postData.data;
    
    if (action === 'save') {
      return saveData(ss, payload);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleLineWebhook(ss, events) {
  var logSheet = ss.getSheetByName("LineLogs");
  if (!logSheet) {
    logSheet = ss.insertSheet("LineLogs");
    logSheet.getRange(1, 1, 1, 5).setValues([[
      "Timestamp", "Event Type", "User ID", "Group/Room ID", "Message Text / Detail"
    ]]).setFontWeight("bold").setBackground("#e2e8f0");
  }
  
  var rows = events.map(function(ev) {
    var timestamp = new Date(ev.timestamp || Date.now());
    var eventType = ev.type || "";
    var userId = ev.source ? (ev.source.userId || "") : "";
    var targetId = ev.source ? (ev.source.groupId || ev.source.roomId || "") : "";
    
    var detail = "";
    if (ev.message) {
      detail = ev.message.text || ev.message.type || "";
    } else if (ev.type === "join" || ev.type === "follow") {
      detail = "Bot joined or User followed";
    }
    
    return [
      Utilities.formatDate(timestamp, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      eventType,
      userId,
      targetId,
      detail
    ];
  });
  
  if (rows.length > 0) {
    var lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow + 1, 1, rows.length, 5).setValues(rows);
    logSheet.autoResizeColumns(1, 5);
  }
}

function saveData(ss, payload) {
  // Beverage lookup dictionary to display names in sheets
  var drinkLookup = {
    'oishi': { th: 'โออิชิ', en: 'Oishi' },
    'grape': { th: 'องุ่นเคียวโฮ', en: 'Kyoho Grape' },
    'bitter': { th: 'เดิมขม', en: 'Original Bitter' },
    'sweet': { th: 'เดิมหวาน', en: 'Original Sweet' },
    'honey-lemon': { th: 'น้ำผึ้งมะนาว', en: 'Honey Lemon' },
    'blueberry': { th: 'บลูเบอร์รี่', en: 'Blueberry' },
    'yogurt': { th: 'โยเกิร์ต', en: 'Yogurt' },
    'strawberry-yogurt': { th: 'โยเกิร์ตสตอเบอรี่', en: 'Strawberry Yogurt' },
    'strawberry': { th: 'สตอเบอรี่', en: 'Strawberry' },
    'apple': { th: 'แอปเปิ้ล', en: 'Apple' },
    'greentea': { th: 'ชาเขียว', en: 'Green Tea' },
    'taro': { th: 'เผือก', en: 'Taro' },
    'cocoa': { th: 'โกโก้', en: 'Cocoa' },
    'watermelon': { th: 'แตงโม', en: 'Watermelon' }
  };

  // 1. Read existing notified IDs to prevent duplicate messages
  var systemSheet = ss.getSheetByName("SystemState");
  if (!systemSheet) {
    systemSheet = ss.insertSheet("SystemState");
    systemSheet.hideSheet(); // Hide it from casual viewing
  }
  
  var notifiedIds = [];
  var lastCellVal = systemSheet.getRange(1, 1).getValue();
  if (lastCellVal) {
    try {
      var parsedCell = JSON.parse(lastCellVal);
      if (parsedCell && parsedCell.notifiedIds) {
        notifiedIds = parsedCell.notifiedIds;
      }
    } catch(e) {}
  }

  // 2. Check for new orders to notify
  var orders = payload.orders || [];
  var newNotifiedIds = [].concat(notifiedIds);
  var notifyMessages = [];
  
  orders.forEach(function(o) {
    if (o.id && notifiedIds.indexOf(o.id) === -1) {
      newNotifiedIds.push(o.id);
      
      // Build notification message for this order
      var totalQty = 0;
      var itemsDesc = [];
      if (o.items) {
        for (var k in o.items) {
          var nameTH = drinkLookup[k] ? drinkLookup[k].th : k;
          itemsDesc.push(nameTH + " x" + o.items[k] + " ขวด");
          totalQty += Number(o.items[k]);
        }
      }
      
      var price = o.priceDetails ? o.priceDetails.total : 0;
      var staff = o.staffName ? " (โดย " + o.staffName + ")" : "";
      var remarkText = o.remark ? "\n📝 หมายเหตุ: " + o.remark : "";
      
      var msg = "🔔 ออเดอร์ใหม่: " + o.customerName + staff +
                "\n🔹 ช่องทาง: " + (o.deliveryType === "grab" ? "Grab Delivery" : (o.deliveryType === "walkin" ? "หน้าร้าน / รับเอง" : "ช่องทางอื่น")) +
                "\n📦 รายการน้ำ: " + itemsDesc.join(", ") +
                "\n🥤 รวม: " + totalQty + " ขวด" +
                "\n💰 ยอดชำระ: " + price.toLocaleString() + " บาท" + remarkText;
      
      notifyMessages.push(msg);
    }
  });

  // 3. Save Raw JSON and new notifiedIds to hidden SystemState sheet
  systemSheet.clear();
  systemSheet.getRange(1, 1).setValue(JSON.stringify({
    state: payload,
    notifiedIds: newNotifiedIds
  }));
  
  // 4. Write Human Readable Orders
  var orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) {
    orderSheet = ss.insertSheet("Orders");
  }
  orderSheet.clear();
  
  // Set headers for Orders
  orderSheet.getRange(1, 1, 1, 15).setValues([[
    "Order ID", "Date", "Time", "Customer Name", "Delivery Type", 
    "Driver Name", "Total Qty", "Subtotal (THB)", 
    "Discount (THB)", "Total Price (THB)", "Status", 
    "Created At", "Updated At", "Staff Name", "Remark"
  ]]);
  
  if (orders.length > 0) {
    var orderRows = orders.map(function(o) {
      // Calculate total bottles in the order
      var totalQty = 0;
      if (o.items) {
        for (var k in o.items) {
          totalQty += Number(o.items[k] || 0);
        }
      }
      
      var discount = 0;
      var total = 0;
      if (o.priceDetails) {
        discount = o.priceDetails.discount || 0;
        total = o.priceDetails.total || 0;
      }
      var subtotal = total + discount;
      
      return [
        o.id || "",
        o.date || "",
        o.time || "",
        o.customerName || "",
        o.deliveryType || "",
        o.grabDriverName || "",
        totalQty,
        subtotal,
        discount,
        total,
        o.status || "",
        o.createdTime || "",
        o.updatedTime || "",
        o.staffName || "",
        o.remark || ""
      ];
    });
    
    // Format headers bold
    orderSheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#e2e8f0");
    orderSheet.getRange(2, 1, orderRows.length, 15).setValues(orderRows);
    orderSheet.autoResizeColumns(1, 15);
  }
  
  // 5. Write Human Readable Grab Pickups
  var grab = payload.grabPickups || [];
  var grabSheet = ss.getSheetByName("GrabPickups");
  if (!grabSheet) {
    grabSheet = ss.insertSheet("GrabPickups");
  }
  grabSheet.clear();
  
  // Set headers for Grab Pickups
  grabSheet.getRange(1, 1, 1, 5).setValues([[
    "Pickup ID", "Driver Name", "Time", "Customer / Order Type", "Items Detail"
  ]]);
  
  if (grab.length > 0) {
    var grabRows = grab.map(function(g) {
      var itemsDetail = "";
      if (g.items) {
        var details = [];
        for (var k in g.items) {
          var nameTH = drinkLookup[k] ? drinkLookup[k].th : k;
          details.push(nameTH + " x" + g.items[k]);
        }
        itemsDetail = details.join(", ");
      }
      
      var formattedTime = "";
      if (g.timestamp) {
        try {
          var d = new Date(g.timestamp);
          formattedTime = Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
        } catch(e) {
          formattedTime = g.timestamp;
        }
      }
      
      return [
        g.id || "",
        g.driverName || "",
        formattedTime,
        g.customerName ? "ลูกค้า: " + g.customerName : "ใบงานเร่งด่วน",
        itemsDetail
      ];
    });
    
    // Format headers bold
    grabSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#e2e8f0");
    grabSheet.getRange(2, 1, grabRows.length, 5).setValues(grabRows);
    grabSheet.autoResizeColumns(1, 5);
  }

  // 6. Write Human Readable Stock
  var stock = payload.stock || {};
  var stockSheet = ss.getSheetByName("Stock");
  if (!stockSheet) {
    stockSheet = ss.insertSheet("Stock");
  }
  stockSheet.clear();
  
  // Set headers for Stock
  stockSheet.getRange(1, 1, 1, 6).setValues([[
    "Drink ID", "Name (TH)", "Name (EN)", "Current Stock (Bottles)", "Status", "Last Updated"
  ]]);
  
  var stockRows = [];
  var lastUpdatedStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
  
  for (var id in drinkLookup) {
    var qty = stock[id] !== undefined ? Number(stock[id]) : 20;
    var status = "ปกติ";
    if (qty === 0) status = "หมด";
    else if (qty <= 5) status = "ใกล้หมด";
    
    stockRows.push([
      id,
      drinkLookup[id].th,
      drinkLookup[id].en,
      qty,
      status,
      lastUpdatedStr
    ]);
  }
  
  stockSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#e2e8f0");
  stockSheet.getRange(2, 1, stockRows.length, 6).setValues(stockRows);
  stockSheet.autoResizeColumns(1, 6);
  
  // 7. Send Notifications
  if (notifyMessages.length > 0) {
    notifyMessages.forEach(function(msg) {
      sendLineOAMessage(msg);
      sendDiscordNotify(msg);
      sendTelegramNotify(msg);
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendLineOAMessage(messageText) {
  if (!LINE_OA_ACCESS_TOKEN || LINE_OA_ACCESS_TOKEN.trim() === "" || !LINE_OA_TARGET_ID || LINE_OA_TARGET_ID.trim() === "") return;
  
  var url = "https://api.line.me/v2/bot/message/push";
  var postData = {
    "to": LINE_OA_TARGET_ID,
    "messages": [
      {
        "type": "text",
        "text": messageText
      }
    ]
  };
  
  var options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + LINE_OA_ACCESS_TOKEN
    },
    "payload": JSON.stringify(postData),
    "muteHttpExceptions": true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch(e) {
    Logger.log("LINE OA Error: " + e.toString());
  }
}

function sendDiscordNotify(messageText) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.trim() === "") return;
  
  var options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify({
      "content": messageText
    }),
    "muteHttpExceptions": true
  };
  
  try {
    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, options);
  } catch(e) {
    Logger.log("Discord Webhook Error: " + e.toString());
  }
}

function sendTelegramNotify(messageText) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.trim() === "" || !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID.trim() === "") return;
  
  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  var options = {
    "method": "post",
    "payload": {
      "chat_id": TELEGRAM_CHAT_ID,
      "text": messageText
    },
    "muteHttpExceptions": true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch(e) {
    Logger.log("Telegram Error: " + e.toString());
  }
}
