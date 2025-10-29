import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const discountSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  internal_notes: z.string().optional(),
  marketing_label: z.string().optional(),
  type: z.enum(["percentage", "fixed_amount", "bogo", "tiered", "bundle", "volume", "free_shipping", "clearance", "flash"]),
  value: z.number().min(0, "Value must be positive"),
  scope: z.enum(["store_wide", "categories", "products", "tags"]),
  channels: z.array(z.enum(["web", "app", "pos", "marketplace"])).min(1),
  min_cart_subtotal: z.number().min(0).default(0),
  min_quantity: z.number().min(0).default(0),
  first_order_only: z.boolean().default(false),
  logged_in_only: z.boolean().default(false),
  global_usage_limit: z.number().optional(),
  per_customer_limit: z.number().optional(),
  per_order_max_discount: z.number().optional(),
  is_stackable: z.boolean().default(false),
  stack_with_shipping: z.boolean().default(true),
  start_date: z.date(),
  end_date: z.date().optional(),
  is_automatic: z.boolean().default(false),
  status: z.enum(["active", "scheduled", "expired", "paused", "archived"]).default("scheduled"),
});

export type DiscountFormData = z.infer<typeof discountSchema>;

interface DiscountFormProps {
  initialData?: Partial<DiscountFormData>;
  onSubmit: (data: DiscountFormData) => void;
  isLoading?: boolean;
}

export function DiscountForm({ initialData, onSubmit, isLoading }: DiscountFormProps) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(initialData?.channels || ["web"]);
  
  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      code: initialData?.code || "",
      name: initialData?.name || "",
      internal_notes: initialData?.internal_notes || "",
      marketing_label: initialData?.marketing_label || "",
      type: initialData?.type || "percentage",
      value: initialData?.value || 0,
      scope: initialData?.scope || "store_wide",
      channels: initialData?.channels || ["web"],
      min_cart_subtotal: initialData?.min_cart_subtotal || 0,
      min_quantity: initialData?.min_quantity || 0,
      first_order_only: initialData?.first_order_only || false,
      logged_in_only: initialData?.logged_in_only || false,
      is_stackable: initialData?.is_stackable || false,
      stack_with_shipping: initialData?.stack_with_shipping || true,
      start_date: initialData?.start_date || new Date(),
      is_automatic: initialData?.is_automatic || false,
      status: initialData?.status || "scheduled",
    },
  });

  const discountType = form.watch("type");
  const isAutomatic = form.watch("is_automatic");

  const handleChannelToggle = (channel: string) => {
    const updated = selectedChannels.includes(channel)
      ? selectedChannels.filter(c => c !== channel)
      : [...selectedChannels, channel];
    setSelectedChannels(updated);
    form.setValue("channels", updated as any);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Discount Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Summer Sale 2025"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Discount Code {!isAutomatic && "*"}</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="SUMMER25"
                disabled={isAutomatic}
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketing_label">Marketing Label</Label>
            <Input
              id="marketing_label"
              {...form.register("marketing_label")}
              placeholder="SALE 20% OFF"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">Internal Notes</Label>
            <Textarea
              id="internal_notes"
              {...form.register("internal_notes")}
              placeholder="Private notes for team..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Discount Type *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                  <SelectItem value="bogo">BOGO / X-for-Y</SelectItem>
                  <SelectItem value="tiered">Tiered Discount</SelectItem>
                  <SelectItem value="bundle">Bundle Price</SelectItem>
                  <SelectItem value="volume">Volume Discount</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  <SelectItem value="clearance">Clearance</SelectItem>
                  <SelectItem value="flash">Flash Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">
                {discountType === "percentage" ? "Percentage %" : "Amount $"}
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                {...form.register("value", { valueAsNumber: true })}
                placeholder={discountType === "percentage" ? "20" : "10"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Applies To</Label>
              <Select
                value={form.watch("scope")}
                onValueChange={(value) => form.setValue("scope", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store_wide">Entire Store</SelectItem>
                  <SelectItem value="categories">Specific Categories</SelectItem>
                  <SelectItem value="products">Specific Products</SelectItem>
                  <SelectItem value="tags">Product Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Channels</Label>
            <div className="flex gap-2 flex-wrap">
              {["web", "app", "pos", "marketplace"].map((channel) => (
                <Badge
                  key={channel}
                  variant={selectedChannels.includes(channel) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleChannelToggle(channel)}
                >
                  {channel.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_automatic"
              checked={form.watch("is_automatic")}
              onCheckedChange={(checked) => form.setValue("is_automatic", checked)}
            />
            <Label htmlFor="is_automatic">Automatic (apply when rules match)</Label>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_cart_subtotal">Min. Cart Subtotal ($)</Label>
              <Input
                id="min_cart_subtotal"
                type="number"
                step="0.01"
                {...form.register("min_cart_subtotal", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_quantity">Min. Quantity</Label>
              <Input
                id="min_quantity"
                type="number"
                {...form.register("min_quantity", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="first_order_only"
                checked={form.watch("first_order_only")}
                onCheckedChange={(checked) => form.setValue("first_order_only", checked)}
              />
              <Label htmlFor="first_order_only">First Order Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="logged_in_only"
                checked={form.watch("logged_in_only")}
                onCheckedChange={(checked) => form.setValue("logged_in_only", checked)}
              />
              <Label htmlFor="logged_in_only">Logged-in Users Only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_stackable"
                checked={form.watch("is_stackable")}
                onCheckedChange={(checked) => form.setValue("is_stackable", checked)}
              />
              <Label htmlFor="is_stackable">Stackable with Other Discounts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="stack_with_shipping"
                checked={form.watch("stack_with_shipping")}
                onCheckedChange={(checked) => form.setValue("stack_with_shipping", checked)}
              />
              <Label htmlFor="stack_with_shipping">Stack with Shipping Discounts</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="global_usage_limit">Global Usage Limit</Label>
            <Input
              id="global_usage_limit"
              type="number"
              {...form.register("global_usage_limit", { valueAsNumber: true })}
              placeholder="Unlimited"
            />
            <p className="text-xs text-muted-foreground">
              Total times this discount can be used across all customers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="per_customer_limit">Per Customer Limit</Label>
            <Input
              id="per_customer_limit"
              type="number"
              {...form.register("per_customer_limit", { valueAsNumber: true })}
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground">
              Max times a single customer can use this discount
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="per_order_max_discount">Max Discount per Order ($)</Label>
            <Input
              id="per_order_max_discount"
              type="number"
              step="0.01"
              {...form.register("per_order_max_discount", { valueAsNumber: true })}
              placeholder="No limit"
            />
            <p className="text-xs text-muted-foreground">
              Cap the maximum discount amount per order
            </p>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("start_date") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("start_date") ? (
                      format(form.watch("start_date"), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("start_date")}
                    onSelect={(date) => date && form.setValue("start_date", date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("end_date") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("end_date") ? (
                      format(form.watch("end_date"), "PPP")
                    ) : (
                      <span>No end date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("end_date")}
                    onSelect={(date) => form.setValue("end_date", date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Discount" : "Create Discount"}
        </Button>
      </div>
    </form>
  );
}
