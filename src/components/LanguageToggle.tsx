import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  // Show the language that will be switched TO (not current)
  const targetLanguage = language === "en" ? "ar" : "en";
  const targetFlag = targetLanguage === "ar" 
    ? "https://flagcdn.com/16x12/sy.png" 
    : "https://flagcdn.com/16x12/us.png";
  const targetText = targetLanguage === "ar" ? "العربية" : "English";
  const targetTextShort = targetLanguage === "ar" ? "AR" : "EN";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 px-2 text-xs flex items-center gap-1"
      aria-label="Toggle language"
    >
      <img 
        src={targetFlag} 
        alt={targetLanguage === "ar" ? "Syria" : "United States"} 
        className="h-3 w-4 object-cover rounded-sm flex-shrink-0"
      />
      <span className="hidden sm:inline text-xs">{targetText}</span>
      <span className="sm:hidden text-xs">{targetTextShort}</span>
    </Button>
  );
};

export default LanguageToggle;

