import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define the hero images mapping
    const heroImages = [
      {
        flag_name: "New Arrival",
        image_path: "/hero-new-arrival.jpg",
        file_name: "hero-new-arrival.jpg"
      },
      {
        flag_name: "Offer", 
        image_path: "/hero-offer.jpg",
        file_name: "hero-offer.jpg"
      },
      {
        flag_name: "Best Seller",
        image_path: "/hero-best-seller.jpg", 
        file_name: "hero-best-seller.jpg"
      },
      {
        flag_name: "Limited Edition",
        image_path: "/hero-limited-edition.jpg",
        file_name: "hero-limited-edition.jpg"
      }
    ];

    const results = [];

    for (const heroImage of heroImages) {
      try {
        // Fetch the image from the assets
        const imageResponse = await fetch(`${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}${heroImage.image_path}`);
        
        if (!imageResponse.ok) {
          results.push({
            flag_name: heroImage.flag_name,
            status: "error",
            message: `Failed to fetch image: ${imageResponse.statusText}`
          });
          continue;
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        // Upload to Supabase storage
        const filePath = `hero-slides/${heroImage.file_name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true
          });

        if (uploadError) {
          results.push({
            flag_name: heroImage.flag_name,
            status: "error",
            message: uploadError.message
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        // Update hero_slides record
        const { error: updateError } = await supabase
          .from("hero_slides")
          .update({ image_url: publicUrl })
          .eq("flag_name", heroImage.flag_name);

        if (updateError) {
          results.push({
            flag_name: heroImage.flag_name,
            status: "error", 
            message: updateError.message
          });
          continue;
        }

        results.push({
          flag_name: heroImage.flag_name,
          status: "success",
          image_url: publicUrl
        });

      } catch (error) {
        results.push({
          flag_name: heroImage.flag_name,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});