import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
const WhatsAppButton = () => {
  const {
    data: settings
  } = useQuery({
    queryKey: ['store-settings-whatsapp'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('store_settings').select('whatsapp_number').limit(1).single();
      if (error) throw error;
      return data;
    }
  });
  const whatsappNumber = settings?.whatsapp_number || '963XXXXXXXXX';
  return <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group" aria-label="Contact us on WhatsApp">
      
    </a>;
};
export default WhatsAppButton;