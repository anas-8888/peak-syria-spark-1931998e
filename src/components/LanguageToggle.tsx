import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="gap-1.5 h-8 px-2 text-xs"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      <span className="hidden sm:inline text-xs">{language === "en" ? "العربية" : "English"}</span>
      <span className="sm:hidden text-xs">{language === "en" ? "AR" : "EN"}</span>
    </Button>
  );
};

export default LanguageToggle;

