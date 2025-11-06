import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type OrderCancellationDialogProps = {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const cancellationReasons = [
  "Changed my mind",
  "Found a better price",
  "Ordered by mistake",
  "Wrong size/color",
  "Delivery taking too long",
  "Other"
];

export const OrderCancellationDialog = ({
  orderId,
  open,
  onOpenChange,
  onSuccess,
}: OrderCancellationDialogProps) => {
  const { t } = useLanguage();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    
    if (!reason.trim()) {
      toast.error(t("Please select or provide a cancellation reason"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          cancel_reason: reason.trim(),
          cancel_date: new Date().toISOString(),
          cancel_status: "pending",
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success(t("Cancellation request submitted"), {
        description: t("Your cancellation request is pending admin approval."),
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error submitting cancellation:", error);
      toast.error(t("Failed to submit cancellation request"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Cancel Order")}</DialogTitle>
          <DialogDescription>
            {t("Please select a reason for canceling your order. Your request will be reviewed by our team.")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {cancellationReasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="cursor-pointer">
                  {t(reason)}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "Other" && (
            <div>
              <Label htmlFor="custom-reason">{t("Please specify")}</Label>
              <Textarea
                id="custom-reason"
                placeholder={t("Enter your reason...")}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Keep Order")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !selectedReason}
          >
            {submitting ? t("Submitting...") : t("Cancel Order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
