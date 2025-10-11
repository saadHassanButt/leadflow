// Test script to verify Google Sheets document access
// Run with: node test-sheets-access.js

const GOOGLE_SHEETS_DOCUMENT_ID = '1ipsWabylSSq1m8GjO1lcyajjqFAqZ4BXoxYBEcRJDUE';

async function testSheetsAccess() {
  console.log('=== TESTING GOOGLE SHEETS ACCESS ===');
  console.log('Document ID:', GOOGLE_SHEETS_DOCUMENT_ID);
  
  // Test 1: Check if document exists (public access)
  console.log('\n1. Testing document existence...');
  try {
    const publicUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_DOCUMENT_ID}/edit`;
    console.log('Public URL:', publicUrl);
    console.log('Try opening this URL in your browser to verify the document exists');
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Test 2: Check API endpoint (without auth - should return 401 or 403, not 404)
  console.log('\n2. Testing API endpoint...');
  try {
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_DOCUMENT_ID}`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    if (response.status === 404) {
      console.log('❌ Document not found - the ID might be incorrect');
    } else if (response.status === 401 || response.status === 403) {
      console.log('✅ Document exists but requires authentication (this is expected)');
    } else {
      console.log('Response body:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

testSheetsAccess();
