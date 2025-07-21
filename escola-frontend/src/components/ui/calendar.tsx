import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /**
   * Enable enhanced navigation with year/month dropdowns
   * @default false
   */
  enableQuickNavigation?: boolean;
};

// Custom caption with year and month dropdowns
function CustomCaption({ displayMonth, id }: CaptionProps) {
  const { goToMonth, previousMonth, nextMonth } = useNavigation();

  // Generate years from 1990 to 2030
  const years = Array.from({ length: 41 }, (_, i) => 1990 + i);
  
  // Portuguese month names
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handleYearChange = (yearValue: string) => {
    const year = parseInt(yearValue);
    const newDate = new Date(year, displayMonth.getMonth());
    goToMonth(newDate);
  };

  const handleMonthChange = (monthValue: string) => {
    const month = parseInt(monthValue);
    const newDate = new Date(displayMonth.getFullYear(), month);
    goToMonth(newDate);
  };

  return (
    <div className="flex justify-between items-center p-2">
      {/* Previous month button */}
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Month and Year dropdowns */}
      <div className="flex items-center gap-2">
        <Select
          value={displayMonth.getMonth().toString()}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, index) => (
              <SelectItem key={index} value={index.toString()}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={displayMonth.getFullYear().toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-20 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Next month button */}
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        )}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  enableQuickNavigation = false,
  ...props
}: CalendarProps) {
  const components = enableQuickNavigation 
    ? {
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: CustomCaption,
      }
    : {
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: enableQuickNavigation 
          ? "flex justify-center pt-1 relative items-center w-full"
          : "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: enableQuickNavigation ? "hidden" : "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={components}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
