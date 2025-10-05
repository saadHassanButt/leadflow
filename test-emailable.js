const testEmailableAPI = async () => {
  // Your NEW private API key
  const API_KEY = 'live_409794c3dce02267b664';
  const testEmail = 'test@example.com';
  
  try {
    console.log('Testing NEW Private API Key...');
    console.log('API Key:', API_KEY);
    console.log('Test email:', testEmail);
    
    const url = `https://api.emailable.com/v1/verify?email=${encodeURIComponent(testEmail)}&api_key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Private API key is working!');
      console.log('Validation result:', JSON.stringify(data, null, 2));
      
      // Test with your actual email too
      console.log('\n🔄 Testing with your email...');
      await testWithRealEmail(API_KEY);
      
    } else {
      const errorText = await response.text();
      console.log('❌ Still failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

const testWithRealEmail = async (apiKey) => {
  const realEmail = 'saadbutt4597@gmail.com';
  
  try {
    const url = `https://api.emailable.com/v1/verify?email=${encodeURIComponent(realEmail)}&api_key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Real email validation result:');
      console.log(JSON.stringify(data, null, 2));
      
      // Show how it maps to your sheet columns
      console.log('\n📊 How this maps to your Google Sheets:');
      console.log({
        email: data.email,
        validation_status: data.state,
        validation_score: data.score,
        validation_reason: data.reason,
        is_deliverable: data.state === 'deliverable',
        is_free_email: data.free,
        is_role_email: data.role,
        is_disposable: data.disposable,
        validated_at: new Date().toISOString()
      });
      
    } else {
      const errorText = await response.text();
      console.log('❌ Real email test failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing real email:', error.message);
  }
};

// Run the test
testEmailableAPI();