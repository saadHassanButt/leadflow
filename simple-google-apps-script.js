// Simple Google Apps Script for adding leads to your Google Sheet
// Copy this code into a new Google Apps Script project at script.google.com

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the spreadsheet and the Leads tab
    const spreadsheetId = '1ipsWabylSSq1m8GjO1lcyajjqFAqZ4BXoxYBEcRJDUE';
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Leads');
    
    // Prepare the row data to match your Leads tab structure
    const rowData = [
      data.lead_id || '',
      data.project_id || '',
      data.name || '',
      data.email || '',
      data.company || '',
      data.position || '',
      data.source || 'Manual Entry',
      data.status || 'Active',
      data.phone || '',
      data.website || '',
      data.address || '',
      data.rating || '',
      data.scraped_at || new Date().toISOString(),
      data.error || ''
    ];
    
    // Append the row to the Leads tab
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Lead added successfully to Google Sheets',
        lead_id: data.lead_id
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'Lead Management Web App is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function to verify the script works
function testAddLead() {
  const testData = {
    lead_id: 'test_lead_' + Date.now(),
    project_id: 'test_project',
    name: 'Test Lead',
    email: 'test@example.com',
    company: 'Test Company',
    position: 'Test Position',
    source: 'Manual Test',
    status: 'Active'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  console.log('Test result:', result.getContent());
}
