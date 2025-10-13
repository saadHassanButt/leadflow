// Emailable API Service for Email Validation
// Documentation: https://emailable.com/api/

const EMILABLE_API_KEY = process.env.EMILABLE_API_KEY || '';
const EMILABLE_BASE_URL = 'https://api.emailable.com/v1';

export interface EmailableResponse {
  email: string;
  state: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  score: number;
  reason: string;
  free: boolean;
  role: boolean;
  disposable: boolean;
  catch_all: boolean;
  mx: boolean;
  smtp: boolean;
  accept_all: boolean;
  block: boolean;
  did_you_mean?: string;
}

export interface EmailableBatchResponse {
  batch_id: string;
  total: number;
  processed: number;
  remaining: number;
  status: 'processing' | 'completed' | 'failed';
  results?: EmailableResponse[];
}

export interface ValidationResult {
  lead_id: string;
  email: string;
  validation_status: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  validation_score: number;
  validation_reason: string;
  is_deliverable: boolean;
  is_free_email: boolean;
  is_role_email: boolean;
  is_disposable: boolean;
  validated_at: string;
}

class EmailableService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = EMILABLE_API_KEY;
    this.baseUrl = EMILABLE_BASE_URL;
    
    // Debug logging
    console.log('Emailable Service initialized:');
    console.log('- API Key source:', process.env.EMILABLE_API_KEY ? 'Environment Variable' : 'Fallback (hardcoded)');
    console.log('- API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
  }

  // Single email verification with retry logic
  async verifyEmail(email: string, retries: number = 3): Promise<EmailableResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Verifying email with Emailable (attempt ${attempt}/${retries}):`, email);
        console.log('API Key:', this.apiKey);
        
        const response = await fetch(
          `${this.baseUrl}/verify?email=${encodeURIComponent(email)}&api_key=${this.apiKey}`
        );

        console.log('Emailable API response status:', response.status);
        
        if (response.status === 249) {
          // Rate limit or processing delay - wait and retry
          if (attempt < retries) {
            console.log(`Rate limit hit (249), waiting ${attempt * 2} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Emailable API error response:', errorText);
          
          if (attempt < retries && response.status >= 500) {
            console.log(`Server error (${response.status}), retrying in ${attempt * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            continue;
          }
          
          throw new Error(`Emailable API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Emailable API success response:', data);
        return data;
      } catch (error) {
        console.error(`Error verifying email (attempt ${attempt}):`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  // Batch email verification (up to 50,000 emails)
  async verifyBatch(emails: string[]): Promise<EmailableBatchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: emails,
          api_key: this.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Emailable batch API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying email batch:', error);
      throw error;
    }
  }

  // Check batch status
  async getBatchStatus(batchId: string): Promise<EmailableBatchResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/batch/${batchId}?api_key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Emailable batch status API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking batch status:', error);
      throw error;
    }
  }

  // Map Emailable response to our validation result format
  mapToValidationResult(leadId: string, email: string, response: EmailableResponse): ValidationResult {
    return {
      lead_id: leadId,
      email: email,
      validation_status: response.state,
      validation_score: response.score,
      validation_reason: response.reason,
      is_deliverable: response.state === 'deliverable',
      is_free_email: response.free,
      is_role_email: response.role,
      is_disposable: response.disposable,
      validated_at: new Date().toISOString()
    };
  }

  // Validate a list of emails and return results
  async validateEmails(emails: { lead_id: string; email: string }[]): Promise<ValidationResult[]> {
    try {
      // For small batches (<= 10), use individual verification
      if (emails.length <= 10) {
        const results: ValidationResult[] = [];
        
        for (const { lead_id, email } of emails) {
          try {
            const response = await this.verifyEmail(email);
            results.push(this.mapToValidationResult(lead_id, email, response));
            
            // Add delay to respect rate limits (25 requests/second)
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.error(`Error validating email ${email}:`, error);
            // Add failed validation result
            results.push({
              lead_id,
              email,
              validation_status: 'unknown',
              validation_score: 0,
              validation_reason: 'API Error',
              is_deliverable: false,
              is_free_email: false,
              is_role_email: false,
              is_disposable: false,
              validated_at: new Date().toISOString()
            });
          }
        }
        
        return results;
      } else {
        // For larger batches, use batch API
        const emailList = emails.map(item => item.email);
        const batchResponse = await this.verifyBatch(emailList);
        
        // Wait for batch completion
        let batchStatus = batchResponse;
        while (batchStatus.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          batchStatus = await this.getBatchStatus(batchResponse.batch_id);
        }
        
        if (batchStatus.status === 'completed' && batchStatus.results) {
          return emails.map(({ lead_id, email }, index) => {
            const response = batchStatus.results![index];
            return this.mapToValidationResult(lead_id, email, response);
          });
        } else {
          throw new Error('Batch validation failed or incomplete');
        }
      }
    } catch (error) {
      console.error('Error validating emails:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailableService = new EmailableService();
