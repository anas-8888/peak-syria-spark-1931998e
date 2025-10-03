import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/963XXXXXXXXX"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 ltr:right-6 rtl:left-6 z-50 group"
      aria-label="Contact us on WhatsApp"
    >
      <Button
        size="lg"
        className="bg-[#25D366] hover:bg-[#20BA5A] text-white px-6 py-6 rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(37,211,102,0.6)] transition-all duration-300 group-hover:scale-110 animate-glow-pulse"
      >
        <MessageCircle className="h-6 w-6 ltr:mr-2 rtl:ml-2" />
        <span className="font-semibold hidden sm:inline">WhatsApp</span>
      </Button>
    </a>
  );
};

export default WhatsAppButton;
