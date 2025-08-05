import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    console.log('🔍 MultiSelectSimple handleSelect called with:', value);
    console.log('📝 Current selected:', selected);
    
    if (selected.includes(value)) {
      const newSelected = selected.filter((item) => item !== value);
      console.log('➖ Removing item, new selection:', newSelected);
      onChange(newSelected);
    } else {
      const newSelected = [...selected, value];
      console.log('➕ Adding item, new selection:', newSelected);
      onChange(newSelected);
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

      {/* Custom dropdown selector */}
      {availableOptions.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-muted-foreground">Adicionar item...</span>
            <svg
              className="h-4 w-4 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          
          {isOpen && (
            <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md w-full mt-1">
              {availableOptions.length === 0 ? (
                <div className="py-2 px-3 text-sm text-muted-foreground">
                  {emptyIndicator}
                </div>
              ) : (
                availableOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      console.log('🎯 Custom dropdown item clicked:', option.value);
                      handleSelect(option.value);
                      setIsOpen(false);
                    }}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}