import { useLocation } from "react-router-dom";
import LanguageToggle from "./LanguageToggle";

const LanguageToggleFloating = () => {
  const location = useLocation();
  
  // Hide the floating button in dashboard
  if (location.pathname.startsWith("/dashboard")) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 left-4 z-50">
      <LanguageToggle />
    </div>
  );
};

export default LanguageToggleFloating;

