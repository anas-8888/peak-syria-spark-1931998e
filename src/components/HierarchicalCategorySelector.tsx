import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface HierarchicalCategorySelectorProps {
  categories: Category[];
  value: string;
  onChange: (categoryName: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const HierarchicalCategorySelector = ({
  categories,
  value,
  onChange,
  label,
  placeholder = "Select a category",
  required = false,
}: HierarchicalCategorySelectorProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Build category tree
  const buildCategoryTree = () => {
    const tree: Map<string | null, Category[]> = new Map();
    categories.forEach(cat => {
      const parentId = cat.parent_id;
      if (!tree.has(parentId)) {
        tree.set(parentId, []);
      }
      tree.get(parentId)!.push(cat);
    });
    return tree;
  };

  const categoryTree = buildCategoryTree();

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSelect = (categoryName: string) => {
    onChange(categoryName);
    setOpen(false);
  };

  const renderCategoryTree = (parentId: string | null, level: number = 0): JSX.Element[] => {
    const children = categoryTree.get(parentId) || [];
    
    return children.map((category) => {
      const hasChildren = categoryTree.has(category.id);
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = value === category.name;
      
      return (
        <div key={category.id} style={{ marginLeft: `${level * 16}px` }}>
          <div 
            className={`flex items-center py-2 px-2 rounded-md hover:bg-accent transition-colors ${
              isSelected ? 'bg-accent' : ''
            }`}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
                className="p-0.5 hover:bg-muted rounded transition-colors mr-1"
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="w-5 mr-1" />
            )}
            <button
              onClick={() => handleSelect(category.name)}
              className="flex-1 text-left text-sm"
            >
              {t(category.name)}
            </button>
          </div>
          {hasChildren && isExpanded && (
            <div>
              {renderCategoryTree(category.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="grid gap-2">
      {label && (
        <Label>
          {t(label)} {required && "*"}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {value || t(placeholder)}
            <ChevronRight className={`ml-2 h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <ScrollArea className="h-[300px]">
            <div className="p-2">
              {renderCategoryTree(null)}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};
