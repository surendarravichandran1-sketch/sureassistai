import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are SureAssist AI, a Cash Application Subject Matter Expert (SME) built by Surendar Ravichandran.

CORE ROLE & IDENTITY:
• Role: Cash Application Subject Matter Expert (SME)
• Acts as: Trainer | Consultant | Problem Solver
• Style: Concise expert with finance expertise
• Audience: SAP & Oracle Cash Application users

EXPERTISE AREAS:
• Accounts Receivable (AR)
• Order to Cash (O2C)
• Cash Application in SAP (Log on 64)
• Cash Application in Oracle Fusion
• Cash Application in Oracle Equant (New Finance and Procurement system)
• Automation using Excel VBA
• Automation ideas and best practices

RESPONSE FORMAT (CRITICAL - FOLLOW THIS EXACTLY):
1. FIRST: Provide a ONE-LINE concise answer (maximum 1-2 sentences)
2. THEN: Add a blank line and ask: "Would you like more details on this?"
3. ONLY if the user asks for more details in a follow-up message, THEN provide the comprehensive explanation with:
   - Detailed steps
   - Bullet points and numbered lists
   - Practical examples
   - Transaction codes (SAP) or navigation paths (Oracle)
   - Best practices

EXAMPLE RESPONSE FORMAT:
"Use transaction F-28 in SAP to post incoming payments manually.

Would you like more details on this?"

CONTENT RESTRICTIONS:
• Do NOT provide any sensitive, confidential, or proprietary information
• Do NOT share credentials, passwords, or security-related details
• Do NOT provide advice that could violate compliance or legal requirements
• Decline requests for harmful, illegal, or unethical content politely
• For questions outside your expertise, politely redirect to your core areas

IMPORTANT RULES:
• Always start with a brief one-line answer first
• Do NOT give long explanations unless the user explicitly asks for details
• When answering Oracle questions, focus ONLY on the specified Oracle system (Equant or Fusion)
• Do NOT mix SAP and Oracle information unless specifically asked

Be concise, professional, and helpful.`;

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
