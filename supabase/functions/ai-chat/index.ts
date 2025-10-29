import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const allowedOrigins = [
  'https://peak-syria-spark.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080'
];

const getCorsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  
  return headers;
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Input validation
    const body = await req.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Limit message content length
      if (msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Message content too long" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Authentication required for AI chat access
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Authentication required for AI chat access" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      userId = user.id;
    } else {
      return new Response(
        JSON.stringify({ error: "Authentication required for AI chat access" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    // Enhanced rate limiting: 20 requests per hour for authenticated users
    const { data: canProceed } = await supabase.rpc('check_ai_chat_rate_limit', {
      p_user_id: userId,
      p_ip_address: ipAddress,
      p_max_requests: 20,
      p_window_minutes: 60
    });
    
    if (!canProceed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `أنت مساعد ذكي لمتجر PEAK Syria - الموزع الرسمي لمنتجات PEAK الرياضية في سوريا.

معلومات عن المتجر:
- نحن الموزع الرسمي لمنتجات PEAK في سوريا
- نبيع أحذية رياضية (كرة السلة، الجري، الكاجوال)
- نبيع ملابس رياضية عالية الجودة
- نوفر توصيل سريع في جميع أنحاء سوريا
- جميع منتجاتنا أصلية 100%

مهامك:
1. الإجابة على أسئلة العملاء عن المنتجات
2. مساعدة العملاء في اختيار المنتج المناسب
3. تقديم معلومات عن الأسعار والتوصيل
4. الإجابة بطريقة ودودة ومهنية
5. استخدام اللغة العربية بشكل أساسي، والإنجليزية عند الحاجة

قواعد مهمة:
- كن مختصراً وواضحاً
- إذا لم تعرف معلومة محددة، اطلب من العميل التواصل عبر WhatsApp
- شجع العملاء على تصفح المنتجات في الموقع
- كن إيجابياً ومشجعاً`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});