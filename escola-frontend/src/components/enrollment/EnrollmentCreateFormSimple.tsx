import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';

// Schema simplificado para teste
const simpleSchema = z.object({
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  biNumber: z.string().min(14, 'BI deve ter 14 caracteres'),
});

type FormData = z.infer<typeof simpleSchema>;

interface SimpleEnrollmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnrollmentCreateFormSimple: React.FC<SimpleEnrollmentFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(simpleSchema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      console.log('Form data:', data);
      
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Sucesso!',
        description: 'Formulário enviado com sucesso!',
      });
      
      reset();
      if (onSuccess) onSuccess();
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao processar formulário'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Teste de Formulário</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Digite o nome"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Digite o sobrenome"
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="biNumber">BI</Label>
            <Input
              id="biNumber"
              {...register('biNumber')}
              placeholder="123456789LA034"
              maxLength={14}
            />
            {errors.biNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.biNumber.message}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Processando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};