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
          stateData = JSON.parse(cellVal);
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

  // 1. Save Raw JSON to a hidden/system sheet for 100% accurate recovery
  var systemSheet = ss.getSheetByName("SystemState");
  if (!systemSheet) {
    systemSheet = ss.insertSheet("SystemState");
    systemSheet.hideSheet(); // Hide it from casual viewing
  }
  systemSheet.clear();
  systemSheet.getRange(1, 1).setValue(JSON.stringify(payload));
  
  // 2. Write Human Readable Orders
  var orders = payload.orders || [];
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
    
    orderSheet.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#e2e8f0");
    orderSheet.getRange(2, 1, orderRows.length, 15).setValues(orderRows);
    orderSheet.autoResizeColumns(1, 15);
  }
  
  // 3. Write Human Readable Grab Pickups
  var grab = payload.grabPickups || [];
  var grabSheet = ss.getSheetByName("GrabPickups");
  if (!grabSheet) {
    grabSheet = ss.insertSheet("GrabPickups");
  }
  grabSheet.clear();
  
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
    
    grabSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#e2e8f0");
    grabSheet.getRange(2, 1, grabRows.length, 5).setValues(grabRows);
    grabSheet.autoResizeColumns(1, 5);
  }

  // 4. Write Human Readable Stock
  var stock = payload.stock || {};
  var stockSheet = ss.getSheetByName("Stock");
  if (!stockSheet) {
    stockSheet = ss.insertSheet("Stock");
  }
  stockSheet.clear();
  
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
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
