// Chatbot Chat API - Main chat processing with Gemini
import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHATBOT CHAT API ===');
    
    const body = await request.json();
    const { message, context, projectId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    console.log('Processing chat message:', message.substring(0, 100) + '...');

    // Format context data for Gemini
    let formattedContext = '';
    if (context) {
      formattedContext = geminiService.formatContextData(context);
      
      // Add conversation history if available
      if (context.conversationHistory) {
        formattedContext += `\n\nCONVERSATION HISTORY:\n${context.conversationHistory}`;
      }
      
      // Add current page context
      if (context.currentPage) {
        formattedContext += `\n\nCURRENT PAGE: ${context.currentPage}\n`;
      }
    }

    // Add project-specific context if projectId is provided
    if (projectId && context?.projects) {
      const currentProject = context.projects.find((p: { project_id: string }) => p.project_id === projectId);
      if (currentProject) {
        formattedContext += `\n\nCURRENT PROJECT FOCUS:\n`;
        formattedContext += `Project: ${currentProject.company_name} (ID: ${currentProject.project_id})\n`;
        formattedContext += `Niche: ${currentProject.niche}\n`;
        formattedContext += `Status: ${currentProject.status}\n`;
        formattedContext += `Lead Count: ${currentProject.leads_count || 0}\n`;
      }
    }

    // Generate response using Gemini
    const response = await geminiService.generateResponse(message, formattedContext);

    console.log('Generated response length:', response.length);

    return NextResponse.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in chatbot chat API:', error);
    
    let errorMessage = 'Failed to process chat message';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      fallbackMessage: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment."
    }, { status: 500 });
  }
}

// Streaming response endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, projectId } = body;

    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 });
    }

    // Format context data for Gemini
    let formattedContext = '';
    if (context) {
      formattedContext = geminiService.formatContextData(context);
    }

    // Add project-specific context if projectId is provided
    if (projectId && context?.projects) {
      const currentProject = context.projects.find((p: { project_id: string }) => p.project_id === projectId);
      if (currentProject) {
        formattedContext += `\n\nCURRENT PROJECT FOCUS:\n`;
        formattedContext += `Project: ${currentProject.company_name} (ID: ${currentProject.project_id})\n`;
        formattedContext += `Niche: ${currentProject.niche}\n`;
        formattedContext += `Status: ${currentProject.status}\n`;
        formattedContext += `Lead Count: ${currentProject.leads_count || 0}\n`;
      }
    }

    // Generate streaming response
    const stream = await geminiService.generateStreamResponse(message, formattedContext);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error in chatbot streaming API:', error);
    return new Response('Failed to process streaming request', { status: 500 });
  }
}
