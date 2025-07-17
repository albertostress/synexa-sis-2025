
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Selecione uma fatura'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  method: z.string().min(1, 'Método de pagamento é obrigatório'),
  receiptNumber: z.string().min(1, 'Número do recibo é obrigatório'),
  paymentDate: z.string().min(1, 'Data do pagamento é obrigatória'),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  selectedInvoice?: string;
}

export default function PaymentForm({ selectedInvoice }: PaymentFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: selectedInvoice || '',
      amount: '',
      method: '',
      receiptNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const onSubmit = (data: PaymentForm) => {
    console.log('Registering payment:', data);
    toast({
      title: 'Sucesso',
      description: 'Pagamento registrado com sucesso.',
    });
    setIsOpen(false);
    form.reset();
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now();
    const receiptNumber = `REC${timestamp}`;
    form.setValue('receiptNumber', receiptNumber);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CreditCard className="w-4 h-4 mr-2" />
          Registrar Pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fatura</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fatura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Mensalidade Janeiro - Ana Silva</SelectItem>
                      <SelectItem value="2">Mensalidade Janeiro - João Santos</SelectItem>
                      <SelectItem value="3">Material Escolar - Ana Silva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Pago (Kz)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="450.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="multicaixa">Multicaixa Express</SelectItem>
                        <SelectItem value="kwik">Kwik</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Recibo</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="REC123456" {...field} />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={generateReceiptNumber}
                      >
                        Gerar
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre o pagamento..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Pagamento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
