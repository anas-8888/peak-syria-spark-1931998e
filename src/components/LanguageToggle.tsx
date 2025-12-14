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
    ? "https://flagcdn.com/24x18/sy.png" 
    : "https://flagcdn.com/24x18/us.png";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-9 w-9 lg:h-10 lg:w-10 rounded-full hover:bg-accent/50 transition-all duration-300 hover:scale-110"
      aria-label="Toggle language"
    >
      <img 
        src={targetFlag} 
        alt={targetLanguage === "ar" ? "العربية" : "English"} 
        className="h-4 w-5 object-cover rounded-sm"
      />
    </Button>
  );
};

export default LanguageToggle;

