import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { useEffect, useState } from "react";

const TOAST_DURATION = 5000; // 5 seconds - must match TOAST_REMOVE_DELAY in use-toast.ts

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return <ToastWithProgress key={id} id={id} title={title} description={description} action={action} {...props} />;
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

function ToastWithProgress({ id, title, description, action, ...props }: any) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!props.open) {
      setProgress(100);
      return;
    }

    // Reset progress when toast opens
    setProgress(100);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 16); // Update every ~16ms for smooth animation (60fps)

    return () => clearInterval(interval);
  }, [props.open, id, props.onOpenChange]);

  return (
    <Toast {...props}>
      <div className="grid gap-1 w-full">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
      {/* Progress Bar - Red bar showing remaining time (right to left) */}
      <div className="absolute bottom-0 h-1 bg-red-500/20 rounded-b-md overflow-hidden" style={{ left: '-24px', right: '-32px' }}>
        <div
          className="h-full bg-red-500 transition-all duration-75 ease-linear absolute right-0"
          style={{ 
            width: `${progress}%`
          }}
        />
      </div>
    </Toast>
  );
}
