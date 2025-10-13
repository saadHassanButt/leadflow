// Gemini AI Service
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('GEMINI_API_KEY not found in environment variables');
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(API_KEY);
    // Use one of the available models from the API response
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    try {
      if (!API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      // Construct the full prompt with context
      let fullPrompt = prompt;
      
      if (context) {
        fullPrompt = `
You are LeadFlow Assistant, an AI helper for a lead generation platform. You have access to the user's Google Sheets data containing their projects, leads, and campaign information.

Context Information:
${context}

User Question: ${prompt}

Instructions:
- Answer based on the provided context data from their Google Sheets
- Be conversational, helpful, and specific
- When referencing data, mention it comes from their connected Google Sheets
- If asked about campaigns, leads, or projects, provide specific numbers and insights
- If you don't have enough context, ask clarifying questions
- Keep responses concise but informative
- Use bullet points or lists when presenting multiple data points
        `.trim();
      }

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return 'I apologize, but I\'m having trouble connecting to my AI service. Please check that the API key is properly configured.';
        }
        if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('RESOURCE_EXHAUSTED')) {
          return 'I\'ve reached my usage limit for now. Please try again later or check your Gemini API quota settings.';
        }
        if (error.message.includes('not found') || error.message.includes('404')) {
          console.error('Model not found error. Available models may have changed.');
          return 'I\'m having trouble with my AI model configuration. The service may be temporarily unavailable.';
        }
      }
      
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }
  }

  async generateStreamResponse(prompt: string, context?: string): Promise<ReadableStream> {
    try {
      if (!API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      let fullPrompt = prompt;
      
      if (context) {
        fullPrompt = `
You are LeadFlow Assistant, an AI helper for a lead generation platform. You have access to the user's Google Sheets data containing their projects, leads, and campaign information.

Context Information:
${context}

User Question: ${prompt}

Instructions:
- Answer based on the provided context data from their Google Sheets
- Be conversational, helpful, and specific
- When referencing data, mention it comes from their connected Google Sheets
- If asked about campaigns, leads, or projects, provide specific numbers and insights
- If you don't have enough context, ask clarifying questions
- Keep responses concise but informative
- Use bullet points or lists when presenting multiple data points
        `.trim();
      }

      const result = await this.model.generateContentStream(fullPrompt);
      
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    } catch (error) {
      console.error('Error generating Gemini stream response:', error);
      throw error;
    }
  }

  // Helper method to format context data
  formatContextData(data: Record<string, unknown>): string {
    try {
      if (!data) return '';

      let context = '';

      // Format projects data
      if (data.projects && Array.isArray(data.projects)) {
        context += `\nPROJECTS DATA:\n`;
        (data.projects as Record<string, unknown>[]).forEach((project: Record<string, unknown>) => {
          context += `- Project: ${project.company_name || project.name} (ID: ${project.project_id})\n`;
          context += `  Niche: ${project.niche}\n`;
          context += `  Status: ${project.status}\n`;
          context += `  Lead Count: ${project.leads_count || project.no_of_leads || 0}\n`;
          context += `  Created: ${project.created_at}\n\n`;
        });
      }

      // Format leads data
      if (data.leads && Array.isArray(data.leads)) {
        context += `\nLEADS DATA:\n`;
        context += `Total Leads: ${data.leads.length}\n`;
        
        // Group by status
        const statusGroups = data.leads.reduce((acc: Record<string, number>, lead: { status: string }) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {});
        
        context += `Status Breakdown:\n`;
        Object.entries(statusGroups).forEach(([status, count]) => {
          context += `  ${status}: ${count}\n`;
        });

        // Group by source
        const sourceGroups = data.leads.reduce((acc: Record<string, number>, lead: { source: string }) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1;
          return acc;
        }, {});
        
        context += `Source Breakdown:\n`;
        Object.entries(sourceGroups).forEach(([source, count]) => {
          context += `  ${source}: ${count}\n`;
        });

        // Recent leads sample
        const recentLeads = data.leads.slice(0, 5);
        context += `\nRecent Leads Sample:\n`;
        recentLeads.forEach((lead: { name: string; email: string; company: string; status: string }) => {
          context += `- ${lead.name} (${lead.email}) at ${lead.company} - Status: ${lead.status}\n`;
        });
      }

      // Format campaign stats if available
      if (data.campaignStats) {
        context += `\nCAMPAIGN STATISTICS:\n`;
        context += JSON.stringify(data.campaignStats, null, 2);
      }

      return context;
    } catch (error) {
      console.error('Error formatting context data:', error);
      return '';
    }
  }
}

export const geminiService = new GeminiService();
