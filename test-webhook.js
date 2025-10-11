// Test script for Google Sheets webhook integration
// Run this with: node test-webhook.js

const testWebhook = async () => {
  const webhookUrl = 'http://192.168.18.180:5678/webhook/google-sheets';
  
  const testLead = {
    action: 'add_lead',
    data: {
      lead_id: `test_lead_${Date.now()}`,
      project_id: 'test-project-123',
      name: 'Test Lead',
      email: 'test@example.com',
      company: 'Test Company',
      position: 'Test Position',
      source: 'Manual Test',
      status: 'Active',
      phone: '(555) 123-4567',
      website: 'https://testcompany.com',
      address: '123 Test St, Test City, TC 12345',
      rating: '5.0',
      scraped_at: new Date().toISOString(),
      error: ''
    }
  };

  try {
    console.log('Testing webhook with data:', JSON.stringify(testLead, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLead)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
};

// Run the test
testWebhook();
