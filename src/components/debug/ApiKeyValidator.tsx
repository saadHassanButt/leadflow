'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function ApiKeyValidator() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const testApiKey = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test the API key by trying to get account info
      const response = await fetch('https://api.mailgun.net/v3/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`api:${process.env.NEXT_PUBLIC_MAILGUN_API_KEY || ''}`)}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API Key test response status:', response.status);
      console.log('API Key test response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('API Key test success data:', data);
        setResult({ 
          success: true, 
          message: `API Key is valid! Found ${data.items?.length || 0} domains.`,
          details: data
        });
      } else {
        const errorData = await response.text();
        console.error('API Key test error:', errorData);
        setResult({ 
          success: false, 
          message: `API Key test failed: ${response.status} - ${errorData}`,
          details: errorData
        });
      }
    } catch (error) {
      console.error('API Key test failed:', error);
      setResult({ 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed top-4 left-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 max-w-sm z-50">
      <div className="flex items-center space-x-2 mb-3">
        <Key className="w-4 h-4 text-yellow-400" />
        <h4 className="text-sm font-medium text-white">API Key Validator</h4>
      </div>

      <div className="space-y-3">
        <Button
          size="sm"
          onClick={testApiKey}
          loading={testing}
          className="w-full"
          icon={<RefreshCw className="w-3 h-3" />}
        >
          {testing ? 'Testing API Key...' : 'Test API Key'}
        </Button>

        {result && (
          <div className={`flex items-start space-x-2 text-xs ${
            result.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {result.success ? (
              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div>{result.message}</div>
              {result.details && result.success && (
                <div className="mt-2 text-neutral-400">
                  <div>Available domains:</div>
                  {result.details.items?.map((domain: any, index: number) => (
                    <div key={index} className="ml-2 text-green-300">
                      • {domain.name} ({domain.state})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-neutral-500">
          <p>This will test if your Mailgun API key is valid and list available domains.</p>
        </div>
      </div>
    </div>
  );
}
