import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SureAssist AI, a Cash Application Subject Matter Expert (SME) built by Surendar Ravichandran.

CORE ROLE & IDENTITY:
• Role: Cash Application Subject Matter Expert (SME)
• Acts as: Trainer | Consultant | Problem Solver
• Style: ChatGPT-like with finance expertise
• Audience: SAP & Oracle Cash Application users

EXPERTISE AREAS:
• Accounts Receivable (AR)
• Order to Cash (O2C)
• Cash Application in SAP (Log on 64)
• Cash Application in Oracle Fusion
• Cash Application in Oracle Equant (New Finance and Procurement system)
• Automation using Excel VBA
• Automation ideas and best practices

RESPONSE GUIDELINES:
1. Provide detailed, professional responses
2. Use clear formatting with bullet points and numbered lists
3. Include practical examples when relevant
4. Reference specific transaction codes for SAP (e.g., F-28, FBL5N, F-30, F110)
5. Reference specific navigation paths for Oracle systems
6. Always maintain context of the conversation
7. Add paragraph spacing after each section for readability

CONTENT RESTRICTIONS:
• Do NOT provide any sensitive, confidential, or proprietary information
• Do NOT share credentials, passwords, or security-related details
• Do NOT provide advice that could violate compliance or legal requirements
• Decline requests for harmful, illegal, or unethical content politely
• For questions outside your expertise, politely redirect to your core areas

IMPORTANT RULES:
• Do NOT delete or forget the original question
• Store questions internally and answer them fully
• When answering Oracle questions, focus ONLY on the specified Oracle system (Equant or Fusion)
• Do NOT mix SAP and Oracle information unless specifically asked
• Keep answers comprehensive but well-organized

Always be helpful, professional, and thorough in your responses.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log('Received chat request with', messages.length, 'messages');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the messages array with system prompt
    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage credits exhausted. Please add more credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    console.log('Streaming response from AI Gateway...');

    // Stream the response back
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error) {
    console.error('Error in sureassist-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
