function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;
  
  if (action === 'save') {
    try {
      var dataStr = e.parameter.data;
      var payload = JSON.parse(decodeURIComponent(dataStr));
      
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
      orderSheet.getRange(1, 1, 1, 12).setValues([[
        "Order ID", "Date", "Table / Source", "Delivery Type", 
        "Driver Name", "Total Qty", "Subtotal (THB)", 
        "Discount (THB)", "Total Price (THB)", "Status", 
        "Created At", "Updated At"
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
          return [
            o.id || "",
            o.date || "",
            o.customerName || "",
            o.deliveryType || "",
            o.driverName || "",
            totalQty,
            o.subtotal || 0,
            o.discount || 0,
            o.total || 0,
            o.status || "",
            o.createdAt || "",
            o.updatedAt || ""
          ];
        });
        
        // Format headers bold
        orderSheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#e2e8f0");
        orderSheet.getRange(2, 1, orderRows.length, 12).setValues(orderRows);
        orderSheet.autoResizeColumns(1, 12);
      }
      
      // 3. Write Human Readable Grab Pickups
      var grab = payload.grabPickups || [];
      var grabSheet = ss.getSheetByName("GrabPickups");
      if (!grabSheet) {
        grabSheet = ss.insertSheet("GrabPickups");
      }
      grabSheet.clear();
      
      // Set headers for Grab Pickups
      grabSheet.getRange(1, 1, 1, 6).setValues([[
        "Pickup ID", "Driver Name / License", "Pickup Time", 
        "Order Count", "Items Detail", "Status"
      ]]);
      
      if (grab.length > 0) {
        var grabRows = grab.map(function(g) {
          return [
            g.id || "",
            g.driverName || "",
            g.time || "",
            g.orders ? g.orders.length : 0,
            g.itemsDetail || "",
            g.status || ""
          ];
        });
        
        // Format headers bold
        grabSheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#e2e8f0");
        grabSheet.getRange(2, 1, grabRows.length, 6).setValues(grabRows);
        grabSheet.autoResizeColumns(1, 6);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else {
    // Default action: Pull/Read data
    try {
      var systemSheet = ss.getSheetByName("SystemState");
      var stateData = { orders: [], grabPickups: [] };
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
