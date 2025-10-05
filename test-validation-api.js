// Test the email validation API endpoint
const testValidationAPI = async () => {
  const testProjectId = 'test_project_123';
  
  try {
    console.log('Testing Email Validation API Endpoint...');
    console.log('Project ID:', testProjectId);
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/validate-project-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-google-access-token': 'test_token',
        'x-google-refresh-token': 'test_refresh',
        'x-google-token-expiry': (Date.now() + 3600000).toString() // 1 hour from now
      },
      body: JSON.stringify({
        project_id: testProjectId
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('Make sure the Next.js dev server is running on port 3000');
  }
};

// Run the test
testValidationAPI();
