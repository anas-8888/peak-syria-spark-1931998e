import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
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