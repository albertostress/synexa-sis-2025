import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Users, 
  Calendar,
  Search, 
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookMarked,
  UserCheck,
  CalendarClock,
  BarChart3,
  FileText,
  Library
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  libraryAPI,
  studentsAPI,
  teachersAPI 
} from '@/lib/api';
import {
  Book,
  Loan,
  CreateBookDto,
  LoanBookDto,
  ReturnBookDto,
  BookFilters,
  LoanFilters,
  LoanStatus,
  LoanStatusLabels,
  LoanStatusColors,
  BookAvailabilityLabels,
  calculateBookAvailability,
  calculateDaysOverdue,
  isLoanOverdue,
  formatUserName,
  formatUserIdentifier,
  BOOK_CATEGORIES,
  LIBRARY_CONFIG
} from '@/types/library';

// Schema de validação para novo livro
const bookSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  author: z.string().min(2, 'Autor deve ter pelo menos 2 caracteres'),
  isbn: z.string().min(10, 'ISBN deve ter pelo menos 10 caracteres'),
  copies: z.number().min(1, 'Deve ter pelo menos 1 cópia'),
  category: z.string().optional(),
  publisher: z.string().optional(),
  publishedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

// Schema de validação para empréstimo
const loanSchema = z.object({
  bookId: z.string().min(1, 'Selecione um livro'),
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type BookFormData = z.infer<typeof bookSchema>;
type LoanFormData = z.infer<typeof loanSchema>;

export default function LibraryAngolan() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [activeTab, setActiveTab] = useState('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>('all');
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [bookPage, setBookPage] = useState(1);
  const [loanPage, setLoanPage] = useState(1);
  const limit = 20;

  // Form setup
  const bookForm = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      author: '',
      isbn: '',
      copies: 1,
      category: '',
      publisher: '',
      publishedYear: new Date().getFullYear(),
      description: '',
      location: '',
    },
  });

  const loanForm = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      bookId: '',
      studentId: '',
      teacherId: '',
      dueDate: libraryAPI.calculateDefaultDueDate(),
      notes: '',
    },
  });

  // ==================== QUERIES ====================

  // Buscar livros
  const { data: booksData, isLoading: loadingBooks } = useQuery({
    queryKey: ['books', searchTerm, statusFilter, categoryFilter, bookPage],
    queryFn: () => {
      const filters: BookFilters = {
        page: bookPage,
        limit,
        ...(searchTerm && { title: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(statusFilter === 'available' && { availableOnly: true }),
      };
      return libraryAPI.getBooks(filters);
    },
  });

  // Buscar empréstimos
  const { data: loansData, isLoading: loadingLoans } = useQuery({
    queryKey: ['loans', loanStatusFilter, loanPage],
    queryFn: () => {
      if (!libraryAPI.canViewAllLoans(user?.role || '')) {
        return libraryAPI.getMyLoans({
          page: loanPage,
          limit,
          ...(loanStatusFilter !== 'all' && { status: loanStatusFilter as LoanStatus }),
        });
      }
      
      const filters: LoanFilters = {
        page: loanPage,
        limit,
        ...(loanStatusFilter !== 'all' && { status: loanStatusFilter as LoanStatus }),
      };
      return libraryAPI.getAllLoans(filters);
    },
    enabled: libraryAPI.canViewLibrary(user?.role || ''),
  });

  // Buscar alunos
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: studentsAPI.getAll,
    enabled: libraryAPI.canManageLoans(user?.role || ''),
  });

  // Buscar professores  
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachersAPI.getAll,
    enabled: libraryAPI.canManageLoans(user?.role || ''),
  });

  // ==================== MUTATIONS ====================

  // Criar novo livro
  const createBookMutation = useMutation({
    mutationFn: (data: CreateBookDto) => libraryAPI.createBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({
        title: 'Livro Adicionado!',
        description: 'O livro foi adicionado ao acervo com sucesso.',
      });
      setIsNewBookOpen(false);
      bookForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Adicionar Livro',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Fazer empréstimo
  const loanBookMutation = useMutation({
    mutationFn: (data: LoanBookDto) => libraryAPI.loanBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Empréstimo Realizado!',
        description: 'O livro foi emprestado com sucesso.',
      });
      setIsNewLoanOpen(false);
      loanForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Realizar Empréstimo',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Devolver livro
  const returnBookMutation = useMutation({
    mutationFn: ({ loanId, returnData }: { loanId: string; returnData?: ReturnBookDto }) => 
      libraryAPI.returnBook(loanId, returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: 'Livro Devolvido!',
        description: 'O livro foi devolvido com sucesso.',
      });
      setIsReturnOpen(false);
      setSelectedLoan(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Devolver Livro',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // Excluir livro
  const deleteBookMutation = useMutation({
    mutationFn: (bookId: string) => libraryAPI.deleteBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({
        title: 'Livro Removido',
        description: 'O livro foi removido do acervo.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Remover Livro',
        description: error.response?.data?.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
    },
  });

  // ==================== HANDLERS ====================

  const handleSubmitBook = (data: BookFormData) => {
    const createData: CreateBookDto = {
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      copies: data.copies,
      category: data.category || undefined,
      publisher: data.publisher || undefined,
      publishedYear: data.publishedYear || undefined,
      description: data.description || undefined,
      location: data.location || undefined,
    };

    createBookMutation.mutate(createData);
  };

  const handleSubmitLoan = (data: LoanFormData) => {
    const errors = libraryAPI.validateLoanRequest(data);
    
    if (errors.length > 0) {
      toast({
        title: 'Dados Inválidos',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    const loanData: LoanBookDto = {
      bookId: data.bookId,
      studentId: data.studentId || undefined,
      teacherId: data.teacherId || undefined,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
    };

    loanBookMutation.mutate(loanData);
  };

  const handleReturnBook = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsReturnOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!selectedLoan) return;

    returnBookMutation.mutate({
      loanId: selectedLoan.id,
      returnData: {
        notes: 'Devolução processada via sistema',
      },
    });
  };

  const handleDeleteBook = (bookId: string) => {
    if (window.confirm('Tem certeza que deseja remover este livro do acervo?')) {
      deleteBookMutation.mutate(bookId);
    }
  };

  // ==================== COMPUTED VALUES ====================

  const currentBooks = booksData?.data || [];
  const currentLoans = loansData?.data || [];
  const booksPagination = booksData?.pagination;
  const loansPagination = loansData?.pagination;

  // Filtrar livros por busca textual
  const filteredBooks = currentBooks.filter(book =>
    searchTerm === '' || 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.includes(searchTerm)
  );

  // KPIs calculados
  const totalBooks = currentBooks.length;
  const availableBooks = currentBooks.filter(book => {
    const available = book.availableCopies ?? (book.copies - (book.activeLoans?.length ?? 0));
    return available > 0;
  }).length;
  const borrowedBooks = currentBooks.reduce((sum, book) => {
    return sum + (book.activeLoans?.length ?? 0);
  }, 0);
  const overdueLoans = currentLoans.filter(loan => 
    loan.status === 'ACTIVE' && isLoanOverdue(loan)
  ).length;

  // Verificar permissões
  const canManageBooks = libraryAPI.canManageBooks(user?.role || '');
  const canManageLoans = libraryAPI.canManageLoans(user?.role || '');
  const canViewLibrary = libraryAPI.canViewLibrary(user?.role || '');

  if (!canViewLibrary) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar a biblioteca.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📚 Biblioteca Escolar</h1>
          <p className="text-muted-foreground">
            Sistema de gestão bibliográfica para escolas angolanas
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {canManageBooks && (
            <Dialog open={isNewBookOpen} onOpenChange={setIsNewBookOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Livro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Adicionar Livro ao Acervo</DialogTitle>
                </DialogHeader>
                
                <Form {...bookForm}>
                  <form onSubmit={bookForm.handleSubmit(handleSubmitBook)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Título */}
                      <FormField
                        control={bookForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Matemática 11ª Classe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Autor */}
                      <FormField
                        control={bookForm.control}
                        name="author"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Autor</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: João Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* ISBN */}
                      <FormField
                        control={bookForm.control}
                        name="isbn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ISBN</FormLabel>
                            <FormControl>
                              <Input placeholder="978-0-123456-78-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Categoria */}
                      <FormField
                        control={bookForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {BOOK_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Cópias */}
                      <FormField
                        control={bookForm.control}
                        name="copies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cópias</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Editora */}
                      <FormField
                        control={bookForm.control}
                        name="publisher"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Editora</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Texto Editores" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Ano */}
                      <FormField
                        control={bookForm.control}
                        name="publishedYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ano</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1900"
                                max={new Date().getFullYear()}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Localização */}
                      <FormField
                        control={bookForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Localização</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Seção A - Prateleira 3" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descrição */}
                      <FormField
                        control={bookForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descrição do livro..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsNewBookOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createBookMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createBookMutation.isPending ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Adicionar Livro
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}

          {canManageLoans && (
            <Dialog open={isNewLoanOpen} onOpenChange={setIsNewLoanOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <BookMarked className="w-4 h-4 mr-2" />
                  Novo Empréstimo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Empréstimo</DialogTitle>
                </DialogHeader>
                
                <Form {...loanForm}>
                  <form onSubmit={loanForm.handleSubmit(handleSubmitLoan)} className="space-y-4">
                    {/* Livro */}
                    <FormField
                      control={loanForm.control}
                      name="bookId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Livro</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o livro" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentBooks
                                  .filter(book => {
                                    const available = book.availableCopies ?? (book.copies - (book.activeLoans?.length ?? 0));
                                    return available > 0;
                                  })
                                  .map((book) => (
                                    <SelectItem key={book.id} value={book.id}>
                                      {book.title} - {book.author}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Aluno */}
                    <FormField
                      control={loanForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aluno</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o aluno" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum aluno</SelectItem>
                                {students.map((student: any) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.firstName} {student.lastName} - {student.studentNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Professor */}
                    <FormField
                      control={loanForm.control}
                      name="teacherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professor</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o professor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum professor</SelectItem>
                                {teachers.map((teacher: any) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.firstName} {teacher.lastName} - {teacher.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Data de Vencimento */}
                    <FormField
                      control={loanForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Vencimento</FormLabel>
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

                    {/* Observações */}
                    <FormField
                      control={loanForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações sobre o empréstimo..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Botões */}
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsNewLoanOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loanBookMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loanBookMutation.isPending ? (
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <BookMarked className="w-4 h-4 mr-2" />
                        )}
                        Registrar Empréstimo
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Livros</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              títulos no acervo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableBooks}</div>
            <p className="text-xs text-muted-foreground">
              livros para empréstimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emprestados</CardTitle>
            <UserCheck className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{borrowedBooks}</div>
            <p className="text-xs text-muted-foreground">
              empréstimos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueLoans}</div>
            <p className="text-xs text-muted-foreground">
              empréstimos vencidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="books">📚 Acervo</TabsTrigger>
          <TabsTrigger value="loans">📖 Empréstimos</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-6">
          {/* Filtros Livros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar livros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtro de Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="available">📗 Disponíveis</SelectItem>
                    <SelectItem value="borrowed">📕 Com Empréstimos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro de Categoria */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    {BOOK_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Limpar Filtros */}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Livros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Acervo Bibliográfico</span>
                {booksPagination && (
                  <span className="text-sm text-muted-foreground">
                    {booksPagination.total} livro(s)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBooks ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum livro encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="w-32">Cópias</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-40">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map((book) => (
                      <TableRow key={book.id}>
                        {/* Título */}
                        <TableCell className="font-medium">
                          <div>
                            <div>{book.title}</div>
                            <div className="text-xs text-muted-foreground">
                              ISBN: {book.isbn}
                            </div>
                          </div>
                        </TableCell>

                        {/* Autor */}
                        <TableCell>{book.author}</TableCell>

                        {/* Categoria */}
                        <TableCell>
                          <Badge variant="outline">
                            {book.category || 'Sem categoria'}
                          </Badge>
                        </TableCell>

                        {/* Cópias */}
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{book.copies} total</div>
                            <div className="text-muted-foreground">
                              {book.availableCopies ?? (book.copies - (book.activeLoans?.length ?? 0))} disponível
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={libraryAPI.getBookStatusColor(book)}>
                            {BookAvailabilityLabels[calculateBookAvailability(book)]}
                          </Badge>
                        </TableCell>

                        {/* Ações */}
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedBook(book)}
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {canManageBooks && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteBook(book.id)}
                                  title="Remover Livro"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Paginação Livros */}
              {booksPagination && booksPagination.pages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {booksPagination.page} de {booksPagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={booksPagination.page <= 1}
                      onClick={() => setBookPage(Math.max(1, bookPage - 1))}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={booksPagination.page >= booksPagination.pages}
                      onClick={() => setBookPage(Math.min(booksPagination.pages, bookPage + 1))}
                    >
                      Próxima
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          {/* Filtros Empréstimos */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro de Status */}
                <Select value={loanStatusFilter} onValueChange={setLoanStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status do Empréstimo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ACTIVE">🔵 Ativo</SelectItem>
                    <SelectItem value="RETURNED">✅ Devolvido</SelectItem>
                    <SelectItem value="OVERDUE">🔴 Em Atraso</SelectItem>
                  </SelectContent>
                </Select>

                {/* Placeholder para outros filtros */}
                <div></div>

                {/* Limpar Filtros */}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setLoanStatusFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Empréstimos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Histórico de Empréstimos</span>
                {loansPagination && (
                  <span className="text-sm text-muted-foreground">
                    {loansPagination.total} empréstimo(s)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLoans ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : currentLoans.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum empréstimo encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Livro</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Empréstimo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                      <TableHead className="w-40">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        {/* Livro */}
                        <TableCell className="font-medium">
                          <div>
                            <div>{loan.book?.title || 'Livro removido'}</div>
                            <div className="text-xs text-muted-foreground">
                              {loan.book?.author}
                            </div>
                          </div>
                        </TableCell>

                        {/* Usuário */}
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatUserName(loan)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatUserIdentifier(loan)}
                              {loan.student && ' (Aluno)'}
                              {loan.teacher && ' (Professor)'}
                            </div>
                          </div>
                        </TableCell>

                        {/* Data Empréstimo */}
                        <TableCell className="text-sm">
                          {format(new Date(loan.loanDate), 'dd/MM/yyyy', { locale: pt })}
                        </TableCell>

                        {/* Vencimento */}
                        <TableCell className="text-sm">
                          <div>
                            <div>{format(new Date(loan.dueDate), 'dd/MM/yyyy', { locale: pt })}</div>
                            {loan.status === 'ACTIVE' && isLoanOverdue(loan) && (
                              <div className="text-xs text-red-600">
                                {calculateDaysOverdue(loan.dueDate)} dias atraso
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={LoanStatusColors[loan.status]}>
                            {LoanStatusLabels[loan.status]}
                          </Badge>
                        </TableCell>

                        {/* Ações */}
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {canManageLoans && loan.status === 'ACTIVE' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReturnBook(loan)}
                                title="Devolver Livro"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedLoan(loan)}
                              title="Ver Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Paginação Empréstimos */}
              {loansPagination && loansPagination.pages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {loansPagination.page} de {loansPagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loansPagination.page <= 1}
                      onClick={() => setLoanPage(Math.max(1, loanPage - 1))}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loansPagination.page >= loansPagination.pages}
                      onClick={() => setLoanPage(Math.min(loansPagination.pages, loanPage + 1))}
                    >
                      Próxima
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Devolução */}
      {selectedLoan && (
        <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Devolução</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div><strong>Livro:</strong> {selectedLoan.book?.title}</div>
                  <div><strong>Usuário:</strong> {formatUserName(selectedLoan)}</div>
                  <div><strong>Empréstimo:</strong> {format(new Date(selectedLoan.loanDate), 'dd/MM/yyyy', { locale: pt })}</div>
                  <div><strong>Vencimento:</strong> {format(new Date(selectedLoan.dueDate), 'dd/MM/yyyy', { locale: pt })}</div>
                  {isLoanOverdue(selectedLoan) && (
                    <div className="text-red-600">
                      <strong>Atraso:</strong> {calculateDaysOverdue(selectedLoan.dueDate)} dias
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReturnOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmReturn} 
                  disabled={returnBookMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {returnBookMutation.isPending ? (
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirmar Devolução
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Informações sobre Sistema de Biblioteca Angola */}
      <Card>
        <CardHeader>
          <CardTitle>🇦🇴 Sistema de Biblioteca Escolar Angola</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Funcionalidades:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-primary font-medium">Acervo completo:</span> Gestão de livros didáticos</li>
                <li>• <span className="text-primary font-medium">Empréstimos:</span> Para alunos e professores</li>
                <li>• <span className="text-primary font-medium">Controle automático:</span> Disponibilidade em tempo real</li>
                <li>• <span className="text-primary font-medium">Multas por atraso:</span> Sistema automático</li>
                <li>• <span className="text-primary font-medium">Relatórios:</span> Histórico completo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Configurações Angola:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <span className="text-blue-600 font-medium">📚 Prazo padrão:</span> {LIBRARY_CONFIG.defaultLoanPeriodDays} dias</li>
                <li>• <span className="text-green-600 font-medium">📖 Limite por usuário:</span> {LIBRARY_CONFIG.maxLoansPerUser} livros</li>
                <li>• <span className="text-orange-600 font-medium">💰 Multa diária:</span> {LIBRARY_CONFIG.lateFeePerDay} AOA</li>
                <li>• <span className="text-purple-600 font-medium">⏰ Tolerância:</span> {LIBRARY_CONFIG.gracePeriodDays} dias</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}