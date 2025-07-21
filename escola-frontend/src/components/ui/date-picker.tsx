import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DatePicker({ 
  date, 
  onChange, 
  placeholder = "Selecionar data",
  className,
  disabled = false,
  minDate = new Date("1900-01-01"),
  maxDate = new Date()
}: DatePickerProps) {
  const [viewDate, setViewDate] = useState(date || new Date());
  const [isOpen, setIsOpen] = useState(false);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // Generate year options
  const startYear = minDate.getFullYear();
  const endYear = maxDate.getFullYear();
  const yearOptions = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => endYear - i
  );

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month start
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value);
    setViewDate(new Date(currentYear, newMonth, 1));
  };

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value);
    setViewDate(new Date(newYear, currentMonth, 1));
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    
    // Check if date is within allowed range
    if (selectedDate >= minDate && selectedDate <= maxDate) {
      onChange(selectedDate);
      setIsOpen(false);
    }
  };

  const isDateDisabled = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate < minDate || checkDate > maxDate;
  };

  const isSelectedDate = (day: number) => {
    if (!date) return false;
    return (
      date.getDate() === day &&
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {date ? (
            format(date, "dd/MM/yyyy", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          {/* Month and Year Selectors */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {/* Week days header */}
            {weekDays.map((day) => (
              <div key={day} className="font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <div key={index} className="aspect-square">
                {day ? (
                  <button
                    className={cn(
                      "h-full w-full rounded-md text-sm hover:bg-accent hover:text-accent-foreground",
                      isSelectedDate(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                      isDateDisabled(day) && "text-muted-foreground cursor-not-allowed opacity-50"
                    )}
                    onClick={() => handleDayClick(day)}
                    disabled={isDateDisabled(day)}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}