import { Toaster as Sonner, toast } from "sonner";
import { useEffect, useRef } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const toasterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debug: Check if Sonner container exists after render
    const checkSonner = () => {
      const toaster = document.querySelector('[data-sonner-toaster]');
      console.log("Sonner toaster element:", toaster);
      if (!toaster) {
        console.error("Sonner toaster not found in DOM!");
        // Try to find it in body
        const bodyToaster = document.body.querySelector('[data-sonner-toaster]');
        console.log("Sonner in body:", bodyToaster);
      } else {
        console.log("Sonner toaster found:", toaster);
      }
    };
    
    // Check after component mounts
    setTimeout(checkSonner, 100);
    setTimeout(checkSonner, 500);
    setTimeout(checkSonner, 1000);
  }, []);

  return (
    <div ref={toasterRef}>
      <Sonner
        theme="light"
        closeButton
        position="top-right"
        richColors
        expand={true}
        visibleToasts={5}
        {...props}
      />
    </div>
  );
};

export { Toaster, toast };
