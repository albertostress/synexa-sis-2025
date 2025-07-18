import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectSimpleProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  emptyIndicator?: React.ReactNode;
}

export function MultiSelectSimple({
  options = [],
  selected = [],
  onChange,
  placeholder = "Selecione itens...",
  className,
  disabled = false,
  emptyIndicator = "Nenhum item disponível",
}: MultiSelectSimpleProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const selectedOptions = selected
    .map((value) => options.find((opt) => opt.value === value))
    .filter(Boolean) as Option[];

  const availableOptions = options.filter(
    (opt) => !selected.includes(opt.value)
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected items display */}
      <div className="flex flex-wrap gap-1">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="pr-1"
            >
              {option.icon && (
                <option.icon className="mr-1 h-3 w-3" />
              )}
              {option.label}
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-secondary-foreground/20 p-0.5"
                onClick={() => handleRemove(option.value)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
      </div>

      {/* Dropdown selector */}
      {availableOptions.length > 0 && (
        <Select
          open={isOpen}
          onOpenChange={setIsOpen}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Adicionar item..." />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.length === 0 ? (
              <div className="py-2 px-3 text-sm text-muted-foreground">
                {emptyIndicator}
              </div>
            ) : (
              availableOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    handleSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    {selected.includes(option.value) && (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4" />
                    )}
                    {option.label}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}