import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/963XXXXXXXXX"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group"
      aria-label="Contact us on WhatsApp"
    >
      <Button
        size="lg"
        className="bg-[#25D366] hover:bg-[#20BA5A] text-white px-4 sm:px-6 py-4 sm:py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
        <span className="font-semibold hidden sm:inline text-sm sm:text-base">WhatsApp</span>
      </Button>
    </a>
  );
};

export default WhatsAppButton;
