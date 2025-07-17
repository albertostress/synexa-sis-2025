import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, Users, Search, GraduationCap, UserCircle, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudents } from '@/hooks/useStudents';
import { Student, CreateStudentDto } from '@/types/student';

const studentSchema = z.object({
  firstName: z.string().min(2, 'Primeiro nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Último nome deve ter no mínimo 2 caracteres'),
  gender: z.enum(['MASCULINO', 'FEMININO']),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  phone: z.string().min(9, 'Telefone deve ter no mínimo 9 dígitos'),
  bloodType: z.string().optional(),
  studentNumber: z.string().min(1, 'Número do aluno é obrigatório'),
  academicYear: z.string().min(4, 'Ano letivo é obrigatório'),
  classId: z.string().min(1, 'Turma é obrigatória'),
  profilePhotoUrl: z.string().optional(),
  guardianName: z.string().min(2, 'Nome do encarregado é obrigatório'),
  guardianPhone: z.string().min(9, 'Telefone do encarregado é obrigatório'),
  municipality: z.string().min(1, 'Município é obrigatório'),
  province: z.string().min(1, 'Província é obrigatória'),
  country: z.string().default('Angola'),
  parentEmail: z.string().email('Email dos pais deve ser válido'),
  parentPhone: z.string().min(9, 'Telefone dos pais é obrigatório'),
});

type StudentFormData = z.infer<typeof studentSchema>;

const provinces = [
  'Luanda', 'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
  'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Lunda Norte',
  'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Função para calcular idade
const calcularIdade = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function StudentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Usar o hook personalizado
  const {
    students,
    isLoading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
  } = useStudents();

  // Debug logs
  console.log('🔍 Estado atual:');
  console.log('- students:', students);
  console.log('- students.length:', students?.length || 0);
  console.log('- isLoading:', isLoading);
  console.log('- error:', error);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'MASCULINO',
      birthDate: '',
      phone: '',
      bloodType: '',
      studentNumber: '',
      academicYear: '2024',
      classId: '',
      profilePhotoUrl: '',
      guardianName: '',
      guardianPhone: '',
      municipality: '',
      province: '',
      country: 'Angola',
      parentEmail: '',
      parentPhone: '',
    },
  });

  // Filtrar estudantes com base na pesquisa
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      student.studentNumber.toLowerCase().includes(searchLower) ||
      student.guardianName.toLowerCase().includes(searchLower)
    );
  });

  const onSubmit = async (data: StudentFormData) => {
    try {
      console.log('📝 Submetendo formulário:', data);

      // Converter data para formato ISO
      const formattedData: CreateStudentDto = {
        ...data,
        birthDate: new Date(data.birthDate).toISOString(),
      };

      if (editingStudent) {
        await updateStudent.mutateAsync({ id: editingStudent.id, ...formattedData });
        toast({
          title: 'Sucesso!',
          description: 'Aluno atualizado com sucesso!',
        });
      } else {
        await createStudent.mutateAsync(formattedData);
        toast({
          title: 'Sucesso!',
          description: 'Aluno criado com sucesso!',
        });
      }

      setIsDialogOpen(false);
      setEditingStudent(null);
      form.reset();
    } catch (error: any) {
      console.error('❌ Erro ao salvar aluno:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao salvar aluno';
      toast({
        title: 'Erro!',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      birthDate: student.birthDate.split('T')[0], // Convert ISO to date input format
      phone: student.phone,
      bloodType: student.bloodType || '',
      studentNumber: student.studentNumber,
      academicYear: student.academicYear,
      classId: student.classId,
      profilePhotoUrl: student.profilePhotoUrl || '',
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      municipality: student.municipality,
      province: student.province,
      country: student.country,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este aluno?')) {
      try {
        await deleteStudent.mutateAsync(id);
        toast({
          title: 'Sucesso!',
          description: 'Aluno removido com sucesso!',
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Erro ao remover aluno';
        toast({
          title: 'Erro!',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              ❌ Erro ao carregar alunos: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>
          <p className="text-muted-foreground">Gerir alunos da escola</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingStudent(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                {editingStudent ? 'Editar Aluno' : 'Adicionar Aluno'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <UserCircle className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primeiro nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Primeiro nome" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Último nome</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Último nome" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o gênero" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MASCULINO">Masculino</SelectItem>
                              <SelectItem value="FEMININO">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grupo sanguíneo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Grupo sanguíneo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bloodTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dados Acadêmicos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Dados Acadêmicos</h3>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="studentNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Aluno</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número do aluno" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="academicYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano letivo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="2024" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Turma (ID)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ID da turma" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contactos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Contactos e Endereço</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do Aluno</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Telefone do aluno" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="parentEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email dos Pais</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} placeholder="Email dos pais" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guardianName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Encarregado</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome do encarregado" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="guardianPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do Encarregado</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Telefone do encarregado" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="municipality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Município</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Município" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Província</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar província" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {provinces.map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
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
                      name="parentPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone dos Pais</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Telefone dos pais" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStudent.isPending || updateStudent.isPending}
                  >
                    {createStudent.isPending || updateStudent.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Pesquisar por nome, número ou encarregado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Alunos ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando alunos...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {students.length === 0 ? 'Nenhum aluno cadastrado' : 'Nenhum aluno encontrado com os filtros aplicados'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Encarregado</TableHead>
                  <TableHead>Província</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.profilePhotoUrl || ""} />
                          <AvatarFallback>
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.gender} • {student.phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentNumber}</TableCell>
                    <TableCell>{calcularIdade(student.birthDate)} anos</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        {student.schoolClass?.name || 'Sem turma'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.guardianName}</div>
                        <div className="text-sm text-muted-foreground">{student.guardianPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{student.province}</TableCell>
                    <TableCell>
                      <Badge variant="default">ATIVO</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(student)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}