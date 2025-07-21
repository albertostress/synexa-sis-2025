import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Plus, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';

import { useEnrollments } from '../../hooks/useEnrollments';
import { studentsAPI } from '../../lib/api';
import {
  enrollmentSchema,
  EnrollmentFormData,
  defaultEnrollmentValues,
  formatBI,
  formatPhone,
  validateBI
} from '../../lib/enrollment-schema';
import {
  PROVINCES,
  GUARDIAN_RELATIONSHIPS,
  GENDERS,
  GENDER_LABELS,
  CreateEnrollmentWithStudentDto
} from '../../types/enrollment';
import { cn } from '../../lib/utils';

interface EnrollmentCreateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnrollmentCreateForm: React.FC<EnrollmentCreateFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [currentTab, setCurrentTab] = useState('student');
  const [studentExists, setStudentExists] = useState<boolean | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const { toast } = useToast();
  const { createEnrollment, fetchClasses, classes, isLoading } = useEnrollments();

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: defaultEnrollmentValues,
    mode: 'onChange'
  });

  const { watch, setValue, reset, formState: { errors } } = form;

  // Carregar turmas ao montar componente
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Verificar se estudante já existe baseado no BI
  const watchedBI = watch('student.biNumber');
  useEffect(() => {
    if (watchedBI && validateBI(watchedBI)) {
      // Fazer verificação real via API
      const checkBIExists = async () => {
        try {
          console.log('🔍 Verificando BI:', watchedBI);
          const result = await studentsAPI.checkByBI(watchedBI);
          console.log('📊 Resultado da verificação:', result);
          setStudentExists(result.exists);
        } catch (error) {
          console.error('❌ Erro ao verificar BI:', error);
          // Em caso de erro, assumir que não existe
          setStudentExists(false);
        }
      };

      const timer = setTimeout(checkBIExists, 500); // Debounce de 500ms
      return () => clearTimeout(timer);
    } else {
      setStudentExists(null);
    }
  }, [watchedBI]);

  // Handler para submissão do formulário
  const onSubmit = async (data: EnrollmentFormData) => {
    console.log('🚀 onSubmit chamado!');
    console.log('📋 Form data recebido:', data);
    
    try {
      const enrollmentData: CreateEnrollmentWithStudentDto = {
        student: data.student,
        academicYear: data.academicYear,
        classId: data.classId,
        status: data.status
      };
      
      console.log('📤 Payload para API:', JSON.stringify(enrollmentData, null, 2));
      console.log('🔄 Chamando createEnrollment...');

      const result = await createEnrollment(enrollmentData);
      
      console.log('✅ Matrícula criada com sucesso:', result);
      
      // Resetar formulário e fechar
      reset();
      setCurrentTab('student');
      setTagInput('');
      setStudentExists(null);
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('❌ Erro ao criar matrícula:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  // Handler para adicionar tags
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag) {
        const currentTags = watch('student.tags') || [];
        if (!currentTags.includes(trimmedTag)) {
          setValue('student.tags', [...currentTags, trimmedTag]);
        }
        setTagInput('');
      }
    }
  };

  // Handler para remover tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = watch('student.tags') || [];
    setValue('student.tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  // Handler para formatação de campos
  const handleBIChange = (value: string) => {
    const formatted = formatBI(value);
    setValue('student.biNumber', formatted);
  };

  const handlePhoneChange = (field: 'student.guardian.phone' | 'guardian.phone') => (value: string) => {
    const formatted = formatPhone(value);
    setValue(field as any, formatted);
  };

  const selectedClass = classes.find(cls => cls.id === watch('classId'));

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nova Matrícula
        </CardTitle>
        <CardDescription>
          Criar uma nova matrícula com dados do estudante e encarregado
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={(e) => {
            console.log('🎯 Form onSubmit event triggered');
            console.log('📝 Form state valid:', form.formState.isValid);
            console.log('🔍 Form errors:', form.formState.errors);
            return form.handleSubmit(onSubmit)(e);
          }} className="space-y-6">
            
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Dados do Estudante
                </TabsTrigger>
                <TabsTrigger value="guardian" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Encarregado
                </TabsTrigger>
                <TabsTrigger value="enrollment" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Matrícula
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: DADOS DO ESTUDANTE */}
              <TabsContent value="student" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <FormField
                    control={form.control}
                    name="student.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: António"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Hermelinda"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Género *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o género" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDERS.map((gender) => (
                              <SelectItem key={gender} value={gender}>
                                {GENDER_LABELS[gender]}
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
                    name="student.birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  new Date(field.value).toLocaleDateString('pt-BR')
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date.toISOString().split('T')[0]);
                                  setIsCalendarOpen(false);
                                }
                              }}
                              disabled={(date) =>
                                date > new Date() || date < new Date('1990-01-01')
                              }
                              enableQuickNavigation={true}
                              fromYear={1990}
                              toYear={2030}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="relative">
                    <FormField
                      control={form.control}
                      name="student.biNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bilhete de Identidade *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="Ex: 123456789LA034"
                                {...field}
                                onChange={(e) => handleBIChange(e.target.value)}
                                maxLength={14}
                              />
                              {studentExists !== null && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  {studentExists ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                          {studentExists !== null && (
                            <Alert className={studentExists ? 'border-amber-500' : 'border-green-500'}>
                              <AlertDescription>
                                {studentExists 
                                  ? '⚠️ Estudante com este BI já existe no sistema'
                                  : '✅ BI disponível para novo estudante'
                                }
                              </AlertDescription>
                            </Alert>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="student.province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Província *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a província" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-60">
                              {PROVINCES.map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.municipality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Município *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Luanda"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <FormLabel>Tags (opcional)</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(watch('student.tags') || []).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Adicionar tag (pressione Enter ou vírgula)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setCurrentTab('guardian')}
                    className="ml-auto"
                  >
                    Próximo: Encarregado →
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: DADOS DO ENCARREGADO */}
              <TabsContent value="guardian" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <FormField
                    control={form.control}
                    name="student.guardian.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Encarregado</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Maria Silva"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.guardian.relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parentesco</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o parentesco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GUARDIAN_RELATIONSHIPS.map((relationship) => (
                              <SelectItem key={relationship} value={relationship}>
                                {relationship}
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
                    name="student.guardian.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 923 456 789"
                            {...field}
                            onChange={(e) => handlePhoneChange('student.guardian.phone')(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.guardian.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Ex: maria@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="student.guardian.bi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BI do Encarregado</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: 987654321LA045"
                            {...field}
                            onChange={(e) => setValue('student.guardian.bi', formatBI(e.target.value))}
                            maxLength={14}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <FormField
                  control={form.control}
                  name="student.guardian.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Rua da Missão, Bairro Maculusso, Luanda"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentTab('student')}
                  >
                    ← Voltar
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setCurrentTab('enrollment')}
                  >
                    Próximo: Matrícula →
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 3: DADOS DA MATRÍCULA */}
              <TabsContent value="enrollment" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <FormField
                    control={form.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano Letivo *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ano letivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[2024, 2025, 2026].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}/{year + 1}
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
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Turma *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a turma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <ScrollArea className="h-60">
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name} ({cls.year}º ano - {cls.capacity} vagas)
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                {selectedClass && (
                  <Alert>
                    <AlertDescription>
                      <strong>Turma selecionada:</strong> {selectedClass.name}<br/>
                      <strong>Ano:</strong> {selectedClass.year}º<br/>
                      <strong>Capacidade:</strong> {selectedClass.capacity} alunos
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentTab('guardian')}
                  >
                    ← Voltar
                  </Button>
                  
                  <div className="flex gap-2">
                    {onCancel && (
                      <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        console.log('💆 Submit button clicked!');
                        console.log('🔍 Current form values:', form.getValues());
                        console.log('📊 Form validation state:', form.formState.isValid);
                        console.log('🚫 Form errors:', form.formState.errors);
                      }}
                    >
                      {isLoading ? 'Criando...' : 'Criar Matrícula'}
                    </Button>
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};