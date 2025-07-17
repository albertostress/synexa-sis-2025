
import { useState } from 'react';
import { Plus, Search, BookOpen, Calendar, User, Filter, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: 'available' | 'borrowed' | 'maintenance';
  borrowedBy?: string;
  borrowDate?: string;
  returnDate?: string;
  location: string;
}

const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Matemática Avançada',
    author: 'João Silva',
    isbn: '978-85-123-4567-8',
    category: 'Matemática',
    status: 'available',
    location: 'Seção A - Prateleira 1'
  },
  {
    id: '2',
    title: 'História de Portugal',
    author: 'Maria Santos',
    isbn: '978-85-987-6543-2',
    category: 'História',
    status: 'borrowed',
    borrowedBy: 'Ana Costa',
    borrowDate: '2024-01-10',
    returnDate: '2024-01-24',
    location: 'Seção B - Prateleira 3'
  }
];

export default function Library() {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    isbn: '',
    category: '',
    location: '',
    status: 'available'
  });
  const { toast } = useToast();

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.isbn.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleAddBook = () => {
    if (!newBook.title || !newBook.author || !newBook.isbn) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const book: Book = {
      id: Date.now().toString(),
      title: newBook.title!,
      author: newBook.author!,
      isbn: newBook.isbn!,
      category: newBook.category || 'Geral',
      location: newBook.location || 'A definir',
      status: 'available'
    };

    setBooks([...books, book]);
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      category: '',
      location: '',
      status: 'available'
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Livro adicionado com sucesso!"
    });
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setNewBook(book);
  };

  const handleUpdateBook = () => {
    if (!editingBook) return;

    setBooks(books.map(book => 
      book.id === editingBook.id 
        ? { ...book, ...newBook }
        : book
    ));
    
    setEditingBook(null);
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      category: '',
      location: '',
      status: 'available'
    });
    
    toast({
      title: "Sucesso",
      description: "Livro atualizado com sucesso!"
    });
  };

  const handleDeleteBook = (id: string) => {
    setBooks(books.filter(book => book.id !== id));
    toast({
      title: "Sucesso",
      description: "Livro removido com sucesso!"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Disponível</Badge>;
      case 'borrowed':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Emprestado</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categories = Array.from(new Set(books.map(book => book.category)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca</h1>
          <p className="text-muted-foreground">Gestão do acervo bibliográfico</p>
        </div>
        <Dialog open={isAddDialogOpen || !!editingBook} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingBook(null);
            setNewBook({
              title: '',
              author: '',
              isbn: '',
              category: '',
              location: '',
              status: 'available'
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Livro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Editar Livro' : 'Novo Livro'}</DialogTitle>
              <DialogDescription>
                {editingBook 
                  ? 'Modifique as informações do livro conforme necessário.'
                  : 'Preencha os campos para adicionar um novo livro ao acervo.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newBook.title || ''}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  placeholder="Digite o título do livro"
                />
              </div>
              <div>
                <Label htmlFor="author">Autor *</Label>
                <Input
                  id="author"
                  value={newBook.author || ''}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  placeholder="Digite o nome do autor"
                />
              </div>
              <div>
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  value={newBook.isbn || ''}
                  onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                  placeholder="Digite o ISBN"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={newBook.category || ''}
                  onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                  placeholder="Digite a categoria"
                />
              </div>
              <div>
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={newBook.location || ''}
                  onChange={(e) => setNewBook({...newBook, location: e.target.value})}
                  placeholder="Digite a localização"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={editingBook ? handleUpdateBook : handleAddBook}
                  className="flex-1"
                >
                  {editingBook ? 'Atualizar' : 'Adicionar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingBook(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Livros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {books.filter(b => b.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emprestados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {books.filter(b => b.status === 'borrowed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por título, autor ou ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="borrowed">Emprestado</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Acervo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>ISBN</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.isbn}</TableCell>
                  <TableCell>{book.category}</TableCell>
                  <TableCell>{getStatusBadge(book.status)}</TableCell>
                  <TableCell>{book.location}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditBook(book)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
