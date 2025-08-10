import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { SchoolClassWithRelations } from '@/types/class';

// Schema de validação
const classFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  classLevel: z.string().min(1, 'Classe é obrigatória'),
  year: z.number().int().min(2020).max(2030),
  shift: z.enum(['MORNING', 'AFTERNOON', 'EVENING']),
  capacity: z.number().int().min(1, 'Capacidade deve ser maior que 0').max(100),
});

type ClassFormData = z.infer<typeof classFormSchema>;

interface ClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClassFormData) => void;
  classData?: SchoolClassWithRelations | null;
  isLoading?: boolean;
}

const CLASS_LEVELS = [
  { value: 'CLASSE_1', label: '1.ª Classe' },
  { value: 'CLASSE_2', label: '2.ª Classe' },
  { value: 'CLASSE_3', label: '3.ª Classe' },
  { value: 'CLASSE_4', label: '4.ª Classe' },
  { value: 'CLASSE_5', label: '5.ª Classe' },
  { value: 'CLASSE_6', label: '6.ª Classe' },
  { value: 'CLASSE_7', label: '7.ª Classe' },
  { value: 'CLASSE_8', label: '8.ª Classe' },
  { value: 'CLASSE_9', label: '9.ª Classe' },
  { value: 'CLASSE_10', label: '10.ª Classe' },
  { value: 'CLASSE_11', label: '11.ª Classe' },
  { value: 'CLASSE_12', label: '12.ª Classe' },
];

const SHIFTS = [
  { value: 'MORNING', label: 'Manhã' },
  { value: 'AFTERNOON', label: 'Tarde' },
  { value: 'EVENING', label: 'Noite' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: year, label: `${year}/${year + 1}` };
});

export default function ClassDialog({
  isOpen,
  onClose,
  onSave,
  classData,
  isLoading = false,
}: ClassDialogProps) {
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: '',
      classLevel: '',
      year: new Date().getFullYear(),
      shift: 'MORNING',
      capacity: 30,
    },
  });

  // Preencher formulário quando editar
  useEffect(() => {
    if (classData) {
      form.reset({
        name: classData.name,
        classLevel: classData.classLevel || '',
        year: classData.year,
        shift: classData.shift,
        capacity: classData.capacity,
      });
    } else {
      form.reset({
        name: '',
        classLevel: '',
        year: new Date().getFullYear(),
        shift: 'MORNING',
        capacity: 30,
      });
    }
  }, [classData, form]);

  const handleSubmit = (data: ClassFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {classData ? 'Editar Turma' : 'Nova Turma'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da turma. Todos os campos são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Turma</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Turma A" {...field} />
                  </FormControl>
                  <FormDescription>
                    Identificação única da turma (ex: A, B, 1, 2)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a classe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CLASS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Nível de ensino da turma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano Letivo</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {YEARS.map((year) => (
                          <SelectItem key={year.value} value={year.value.toString()}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SHIFTS.map((shift) => (
                          <SelectItem key={shift.value} value={shift.value}>
                            {shift.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidade Máxima</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="30" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Número máximo de alunos na turma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {classData ? 'Atualizar' : 'Criar'} Turma
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}