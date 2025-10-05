// Test script to debug leads fetching
const testLeadsFetch = async () => {
  const projectId = 'your_project_id_here'; // Replace with your actual project ID
  
  try {
    console.log('Testing leads fetch for project:', projectId);
    
    // Get tokens from localStorage (you'll need to run this in browser console)
    const accessToken = localStorage.getItem('google_access_token');
    const refreshToken = localStorage.getItem('google_refresh_token');
    const tokenExpiry = localStorage.getItem('google_token_expiry');
    
    console.log('Tokens:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      tokenExpiry: tokenExpiry
    });
    
    const response = await fetch(`/api/leads?project_id=${projectId}`, {
      headers: {
        'x-google-access-token': accessToken || '',
        'x-google-refresh-token': refreshToken || '',
        'x-google-token-expiry': tokenExpiry || '0',
      }
    });
    
    console.log('API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log('Success:', data.success);
      console.log('Count:', data.count);
      console.log('Leads:', data.data);
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Instructions for use:
console.log('To test leads fetching:');
console.log('1. Open browser console on your leads page');
console.log('2. Copy and paste this entire script');
console.log('3. Replace "your_project_id_here" with your actual project ID');
console.log('4. Run: testLeadsFetch()');
