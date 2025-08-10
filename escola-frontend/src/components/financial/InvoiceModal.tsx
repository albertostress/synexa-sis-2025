import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  Clock,
  User,
  DollarSign,
  Calendar,
  FileText,
  Check,
  ChevronsUpDown,
  Info,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { formatCurrency } from '@/types/finance';
import { financialAPI } from '@/lib/api';

// Schema de validação avançado
const advancedInvoiceSchema = z.object({
  studentId: z.string().min(1, 'Selecione um aluno'),
  category: z.string().min(1, 'Selecione uma categoria'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  notes: z.string().optional(),
  paymentInstallments: z.number().min(1).max(12).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
});

type AdvancedInvoiceFormData = z.infer<typeof advancedInvoiceSchema>;

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  students: any[];
  isLoading: boolean;
}

export function InvoiceModal({ 
  open, 
  onClose, 
  onSubmit, 
  students, 
  isLoading 
}: InvoiceModalProps) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [openStudentCombobox, setOpenStudentCombobox] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  const categories = financialAPI.getInvoiceCategories();

  const form = useForm<AdvancedInvoiceFormData>({
    resolver: zodResolver(advancedInvoiceSchema),
    defaultValues: {
      studentId: '',
      category: '',
      amount: 0,
      description: '',
      dueDate: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      notes: '',
      paymentInstallments: 1,
      discountPercentage: 0,
    },
  });

  // Filtrar estudantes por busca
  const filteredStudents = students.filter((student) =>
    student.firstName?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    student.studentNumber?.includes(searchStudent)
  );

  // Efeito para sugerir valor padrão baseado na categoria
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.value === selectedCategory);
      if (category && category.defaultAmount > 0) {
        form.setValue('amount', category.defaultAmount);
        
        // Gerar descrição automática
        const month = form.getValues('month');
        const year = form.getValues('year');
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        let description = category.label;
        if (category.value === 'PROPINA') {
          description = `Propina de ${monthNames[month - 1]} ${year}`;
        } else if (category.value === 'MATRICULA') {
          description = `Taxa de Matrícula ${year}`;
        }
        
        form.setValue('description', description);
      }
    }
  }, [selectedCategory, form]);

  // Calcular valor final com desconto
  const amount = form.watch('amount') || 0;
  const discountPercentage = form.watch('discountPercentage') || 0;
  const finalAmount = amount - (amount * discountPercentage / 100);

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    form.setValue('studentId', student.id);
    setOpenStudentCombobox(false);
    setSearchStudent('');
  };

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    form.setValue('category', categoryValue);
  };

  const handleSubmit = (data: AdvancedInvoiceFormData) => {
    const finalData = {
      ...data,
      amount: finalAmount, // Usar valor com desconto
      student: selectedStudent,
      category: categories.find(cat => cat.value === data.category),
    };
    onSubmit(finalData);
  };

  const handleClose = () => {
    form.reset();
    setSelectedStudent(null);
    setSelectedCategory(null);
    setSearchStudent('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Fatura Avançada
          </DialogTitle>
          <DialogDescription>
            Crie faturas inteligentes com sugestões automáticas e validações para Angola
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações do Aluno */}
            <Card className="border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-900">Dados do Aluno</span>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aluno *</FormLabel>
                        <Popover open={openStudentCombobox} onOpenChange={setOpenStudentCombobox}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openStudentCombobox}
                                className="w-full justify-between"
                              >
                                {selectedStudent
                                  ? `${selectedStudent.firstName} ${selectedStudent.lastName} - ${selectedStudent.studentNumber}`
                                  : "Selecione o aluno..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Buscar aluno..." 
                                value={searchStudent}
                                onValueChange={setSearchStudent}
                              />
                              <CommandEmpty>Nenhum aluno encontrado.</CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                  {filteredStudents.map((student) => (
                                    <CommandItem
                                      key={student.id}
                                      value={`${student.firstName} ${student.lastName} ${student.studentNumber}`}
                                      onSelect={() => handleStudentSelect(student)}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          selectedStudent?.id === student.id ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      <div>
                                        <div>{student.firstName} {student.lastName}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {student.studentNumber} • {student.academicYear}º Ano
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandList>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedStudent && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Turma:</strong> {selectedStudent.classId || 'N/A'}</div>
                        <div><strong>Ano:</strong> {selectedStudent.academicYear}º</div>
                        <div><strong>Status:</strong> 
                          <Badge variant="outline" className="ml-1">
                            {selectedStudent.enrollmentStatus || 'Ativo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações da Fatura */}
            <Card className="border-green-200">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-900">Dados da Fatura</span>
                  </div>
                  
                  {/* Categoria */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={handleCategorySelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{category.label}</span>
                                    {category.defaultAmount > 0 && (
                                      <Badge variant="outline" className="ml-2">
                                        {formatCurrency(category.defaultAmount)}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                        {selectedCategory && (
                          <div className="flex items-center space-x-2 text-xs text-green-600">
                            <Lightbulb className="h-3 w-3" />
                            <span>Valor e descrição preenchidos automaticamente</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Valor e Desconto */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Original (AOA) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desconto (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Valor Final */}
                  {discountPercentage > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Valor Final:</span>
                        <span className="text-lg font-bold text-green-700">
                          {formatCurrency(finalAmount)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Desconto aplicado: {formatCurrency(amount - finalAmount)} ({discountPercentage}%)
                      </div>
                    </div>
                  )}

                  {/* Descrição */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Propina de Janeiro 2024"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Datas e Configurações */}
            <Card className="border-purple-200">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-purple-900">Configurações de Pagamento</span>
                  </div>
                  
                  {/* Data de Vencimento */}
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mês/Ano */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mês de Referência</FormLabel>
                          <FormControl>
                            <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((month, index) => (
                                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="2020"
                              max="2030"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notas */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações adicionais sobre esta fatura..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !selectedStudent}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Fatura
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}