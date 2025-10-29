import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type Color = {
  id: string;
  name: string;
  hex_code: string;
};

type ColorSelectorProps = {
  selectedColorIds: string[];
  onSelectionChange: (colorIds: string[]) => void;
};

export const ColorSelector = ({ selectedColorIds, onSelectionChange }: ColorSelectorProps) => {
  const { data: colors = [], isLoading } = useQuery({
    queryKey: ["colors-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colors")
        .select("id, name, hex_code")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Color[];
    }
  });

  const toggleColor = (colorId: string) => {
    if (selectedColorIds.includes(colorId)) {
      onSelectionChange(selectedColorIds.filter(id => id !== colorId));
    } else {
      onSelectionChange([...selectedColorIds, colorId]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading colors...</div>;
  }

  if (colors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No colors available. Please add colors in the Colors management section.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] w-full border rounded-md p-4">
      <div className="grid grid-cols-2 gap-3">
        {colors.map((color) => (
          <div key={color.id} className="flex items-center space-x-2">
            <Checkbox
              id={`color-${color.id}`}
              checked={selectedColorIds.includes(color.id)}
              onCheckedChange={() => toggleColor(color.id)}
            />
            <Label
              htmlFor={`color-${color.id}`}
              className="flex items-center gap-2 cursor-pointer font-normal"
            >
              <div
                className="w-6 h-6 rounded border-2 border-border flex-shrink-0"
                style={{ backgroundColor: color.hex_code }}
              />
              <span>{color.name}</span>
            </Label>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
