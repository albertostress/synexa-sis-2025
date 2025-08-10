import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Users, Search, GraduationCap, UserCircle, MapPin, Filter, Download, BarChart3, Calendar, TrendingUp, Phone, Upload, FileText, Camera, Tag, Loader2, X, Mail, IdCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudents } from '@/hooks/useStudents';
import { Student, CreateStudentDto } from '@/types/student';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StudentFullProfileModal } from '@/components/students/StudentFullProfileModal';
import { DatePicker } from '@/components/ui/date-picker';
import { mapStudentFormToDto } from '@/utils/student-mappers';
import { useAuth } from '@/contexts/AuthContext';

// Schema de validação alinhado com backend - FASE 22
const studentSchema = z.object({
  // ✅ OBRIGATÓRIOS - Identificação Pessoal
  firstName: z.string().min(2, 'Primeiro nome deve ter no mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Último nome deve ter no mínimo 2 caracteres'),
  gender: z.enum(['MASCULINO', 'FEMININO'], {
    required_error: 'Gênero é obrigatório'
  }),
  biNumber: z.string()
    .min(8, 'Número do BI deve ter no mínimo 8 caracteres')
    .max(20, 'Número do BI deve ter no máximo 20 caracteres')
    .regex(/^\d{6,9}[A-Z]{2}\d{3}$/, 'Formato inválido do BI (ex: 003456789LA042)'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  
  // ✅ OBRIGATÓRIOS - Dados Acadêmicos
  classId: z.string().min(1, 'Classe é obrigatória'),
  academicYear: z.string().min(4, 'Ano letivo é obrigatório'),
  
  // 🟡 OPCIONAIS - Dados Acadêmicos
  studentNumber: z.string().optional(), // Gerado automaticamente no formato AAAA-0001
  status: z.enum(['ATIVO', 'TRANSFERIDO', 'DESISTENTE', 'CONCLUIDO']).optional(),
  
  // ✅ OBRIGATÓRIOS - Localização
  municipality: z.string().min(3, 'Município deve ter no mínimo 3 caracteres'),
  province: z.string().min(3, 'Província deve ter no mínimo 3 caracteres'),
  country: z.string().optional(),
  
  // ✅ OBRIGATÓRIOS - Encarregado de Educação (conforme backend)
  guardianName: z.string().min(2, 'Nome do encarregado é obrigatório'),
  guardianPhone: z.string()
    .min(9, 'Telefone do encarregado deve ter no mínimo 9 dígitos')
    .regex(/^(\+244|244)?[9][0-9]{8}$/, 'Formato inválido para contacto do encarregado'),
  parentEmail: z.string().email('Email dos pais deve ser válido'),
  parentPhone: z.string()
    .min(9, 'Telefone dos pais deve ter no mínimo 9 dígitos')
    .regex(/^(\+244|244)?[9][0-9]{8}$/, 'Formato inválido para contacto dos pais'),
  
  // 🟡 OPCIONAIS - Dados extras (não enviados para backend)
  guardianRelationship: z.enum(['PAI', 'MAE', 'AVO', 'TIO', 'IRMAO', 'TUTOR', 'OUTRO']).optional(),
  guardianId: z.string().optional(),
  guardianAddress: z.string().optional(),
  
  // 🟡 OPCIONAIS - Documentos e Arquivos
  profilePhotoUrl: z.string().optional(),
  idDocumentUrl: z.string().optional(),
  studentCardUrl: z.string().optional(),
  
  // 🟡 OPCIONAIS - Upload de ficheiros
  studentPhoto: z
    .any()
    .refine((file) => !file || file instanceof File, 'Formato de arquivo inválido')
    .refine((file) => !file || file?.size <= 5 * 1024 * 1024, 'Foto deve ter no máximo 5MB')
    .refine(
      (file) => !file || ['image/jpeg', 'image/jpg', 'image/png'].includes(file?.type),
      'Apenas ficheiros .jpg, .jpeg ou .png são aceitos'
    )
    .optional(),
  biDocument: z
    .any()
    .refine((file) => !file || file instanceof File, 'Formato de arquivo inválido')
    .refine((file) => !file || file?.size <= 5 * 1024 * 1024, 'Documento deve ter no máximo 5MB')
    .refine(
      (file) => !file || ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file?.type),
      'Apenas ficheiros .pdf, .jpg, .jpeg ou .png são aceitos'
    )
    .optional(),
  studentCard: z
    .any()
    .refine((file) => !file || file instanceof File, 'Formato de arquivo inválido')
    .refine((file) => !file || file?.size <= 5 * 1024 * 1024, 'Documento deve ter no máximo 5MB')
    .refine(
      (file) => !file || ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file?.type),
      'Apenas ficheiros .pdf, .jpg, .jpeg ou .png são aceitos'
    )
    .optional(),
  
  // 🟡 OPCIONAIS - Tags e Observações
  tags: z.array(z.string()).default([]),
  observations: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

const provinces = [
  'Luanda', 'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
  'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Lunda Norte',
  'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
];

// Mapeamento de municípios por província (Angola)
const municipiosPorProvincia: Record<string, string[]> = {
  'Luanda': ['Luanda', 'Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo', 'Quissama', 'Viana'],
  'Bengo': ['Caxito', 'Ambriz', 'Bula Atumba', 'Dande', 'Dembos', 'Nambuangongo', 'Pango Aluquém'],
  'Benguela': ['Benguela', 'Baía Farta', 'Bocoio', 'Caimbambo', 'Chongorói', 'Cubal', 'Ganda', 'Lobito'],
  'Bié': ['Kuito', 'Andulo', 'Camacupa', 'Catabola', 'Chinguar', 'Chitembo', 'Cunhinga', 'Nharea'],
  'Cabinda': ['Cabinda', 'Belize', 'Buco-Zau', 'Cacongo'],
  'Cuando Cubango': ['Menongue', 'Calai', 'Cuangar', 'Cuchi', 'Dirico', 'Mavinga', 'Nancova', 'Rivungo'],
  'Cuanza Norte': ['N\'dalatando', 'Ambaca', 'Banga', 'Bolongongo', 'Cambambe', 'Cazengo', 'Golungo Alto', 'Gonguembo', 'Lucala', 'Quiculungo', 'Samba Caju'],
  'Cuanza Sul': ['Sumbe', 'Amboim', 'Cassongue', 'Cela', 'Conda', 'Ebo', 'Libolo', 'Mussende', 'Porto Amboim', 'Quibala', 'Quilenda', 'Seles'],
  'Cunene': ['Ondjiva', 'Cahama', 'Cuanhama', 'Curoca', 'Namacunde', 'Ombadja'],
  'Huambo': ['Huambo', 'Bailundo', 'Catchiungo', 'Caála', 'Ecunha', 'Londuimbali', 'Longonjo', 'Mungo', 'Tchicala-Tcholoanga', 'Tchindjenje', 'Ukuma'],
  'Huíla': ['Lubango', 'Caconda', 'Cacula', 'Caluquembe', 'Chiange', 'Chibia', 'Chicomba', 'Chipindo', 'Cuvango', 'Gambos', 'Humpata', 'Jamba', 'Matala', 'Quilengues', 'Quipungo'],
  'Lunda Norte': ['Lucapa', 'Cambulo', 'Capenda-Camulemba', 'Caungula', 'Chitato', 'Cuango', 'Lubalo', 'Xá-Muteba'],
  'Lunda Sul': ['Saurimo', 'Cacolo', 'Dala', 'Muconda'],
  'Malanje': ['Malanje', 'Cacuso', 'Calandula', 'Cambundi-Catembo', 'Cangandala', 'Caombo', 'Cuaba Nzogo', 'Cunda-Dia-Baze', 'Luquembo', 'Marimba', 'Massango', 'Mucari', 'Quela', 'Quirima'],
  'Moxico': ['Luena', 'Alto Zambeze', 'Bundas', 'Camanongue', 'Léua', 'Luacano', 'Luchazes', 'Cameia', 'Moxico'],
  'Namibe': ['Moçâmedes', 'Bibala', 'Camucuio', 'Tômbwa', 'Virei'],
  'Uíge': ['Uíge', 'Alto Cauale', 'Ambuila', 'Bembe', 'Buengas', 'Bungo', 'Damba', 'Milunga', 'Mucaba', 'Negage', 'Puri', 'Quimbele', 'Quitexe', 'Sanza Pombo', 'Songo', 'Zombo'],
  'Zaire': ['M\'banza Kongo', 'Cuimba', 'Nóqui', 'Nzeto', 'Soyo', 'Tomboco']
};

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
  console.log('🔄 StudentsPage carregado - versão atualizada!');

  const { user, hasAnyRole } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Debug: verificar estado do usuário
  if (import.meta.env.DEV) {
    console.log('🔍 User role check:', { 
      userRole: user?.role, 
      isAdmin: user?.role === 'ADMIN',
      isSecretaria: user?.role === 'SECRETARIA', 
      isProfessor: user?.role === 'PROFESSOR'
    });
  }

  // Obtém municípios da província selecionada
  const municipiosDisponiveis = selectedProvince && selectedProvince !== 'all' ? municipiosPorProvincia[selectedProvince] || [] : [];

  // Buscar turmas do backend com cache otimizado
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return Array.isArray(response.data) ? response.data : response.data.classes || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos cache
    cacheTime: 1000 * 60 * 30, // 30 minutos em memória
  });

  // Usar o hook personalizado
  const {
    students,
    isLoading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
  } = useStudents();

  // Filtrar estudantes com base na pesquisa e filtros
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || (
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.guardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.municipality.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesProvince = !selectedProvince || selectedProvince === 'all' || student.province === selectedProvince;
    const matchesClass = !filterClass || filterClass === 'all' || student.classId === filterClass;
    const matchesGender = !filterGender || filterGender === 'all' || student.gender === filterGender;
    
    return matchesSearch && matchesProvince && matchesClass && matchesGender;
  });

  // Calcular estatísticas
  const totalStudents = students.length;
  const maleStudents = students.filter(s => s.gender === 'MASCULINO').length;
  const femaleStudents = students.filter(s => s.gender === 'FEMININO').length;
  const avgAge = students.length > 0 ? 
    Math.round(students.reduce((sum, s) => sum + calcularIdade(s.birthDate), 0) / students.length) : 0;

  // Função para exportar dados
  const handleExport = () => {
    const csvData = filteredStudents.map(student => ({
      'Nome': `${student.firstName} ${student.lastName}`,
      'Número': student.studentNumber,
      'Sexo': student.gender,
      'Idade': calcularIdade(student.birthDate),
      'Classe': student.schoolClass?.name || 'Sem classe',
      'Encarregado': student.guardianName,
      'Contacto Encarregado': student.guardianPhone,
      'Província': student.province,
      'Município': student.municipality,
      'Ano Letivo': student.academicYear
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estudantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Sucesso!',
      description: `${filteredStudents.length} estudantes exportados com sucesso!`,
    });
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedProvince('all');
    setFilterClass('all');
    setFilterGender('all');
    toast({
      title: 'Filtros limpos',
      description: 'Todos os filtros foram removidos',
    });
  };

  // Função para editar estudante
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  // Função para remover estudante
  const handleDeleteStudent = (studentId: string) => {
    if (confirm('Tem certeza que deseja remover este estudante?')) {
      deleteStudent.mutate(studentId, {
        onSuccess: () => {
          toast({
            title: 'Sucesso!',
            description: 'Estudante removido com sucesso!',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Erro!',
            description: error?.response?.data?.message || 'Erro ao remover estudante',
            variant: 'destructive',
          });
        },
      });
    }
  };

  // Função para abrir preview do estudante
  const handlePreviewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsPreviewOpen(true);
  };

  // Debug logs (apenas em desenvolvimento)
  if (import.meta.env.DEV) {
    console.log('🔍 Students estado:', { 
      studentsLength: students?.length || 0, 
      filteredLength: filteredStudents?.length || 0,
      isLoading, 
      hasError: !!error,
      studentsType: Array.isArray(students) ? 'array' : typeof students
    });
  }

  return (
    <div className="h-full flex flex-col space-y-4">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {user?.role === 'PROFESSOR' ? 'Meus Alunos' : 'Estudantes'}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === 'PROFESSOR'
              ? 'Alunos das turmas onde você leciona' 
              : 'Gerir estudantes da escola - Interface melhorada'
            }
          </p>
        </div>
        
        {(user?.role === 'ADMIN' || user?.role === 'SECRETARIA') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2"
                onClick={() => {
                  setEditingStudent(null);
                  // Reset form when opening dialog
                }}
              >
                <Plus className="w-4 h-4" />
                Adicionar Estudante
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                {editingStudent ? 'Editar Estudante' : 'Adicionar Estudante'}
              </DialogTitle>
            </DialogHeader>
            
            <StudentForm
              editingStudent={editingStudent}
              classes={classes}
              classesLoading={classesLoading}
              provinces={provinces}
              municipiosPorProvincia={municipiosPorProvincia}
              onSubmit={(data) => {
                if (editingStudent) {
                  updateStudent.mutate({ ...data, id: editingStudent.id }, {
                    onSuccess: () => {
                      setIsDialogOpen(false);
                      setEditingStudent(null);
                      toast({
                        title: 'Sucesso!',
                        description: 'Estudante atualizado com sucesso!',
                      });
                    },
                    onError: (error: any) => {
                      toast({
                        title: 'Erro!',
                        description: error?.response?.data?.message || 'Erro ao atualizar estudante',
                        variant: 'destructive',
                      });
                    },
                  });
                } else {
                  // Mapear dados do formulário para o DTO
                  try {
                    const dto = mapStudentFormToDto(data);
                    createStudent.mutate(dto, {
                      onSuccess: (newStudent) => {
                        setIsDialogOpen(false);
                        toast({
                          title: 'Sucesso!',
                          description: `Estudante ${newStudent?.firstName || ''} criado com sucesso! ${newStudent?.studentNumber ? `Número: ${newStudent.studentNumber}` : ''}`,
                        });
                      },
                      onError: (error: any) => {
                        toast({
                          title: 'Erro!',
                          description: error?.response?.data?.message || 'Erro ao criar estudante',
                          variant: 'destructive',
                        });
                      },
                    });
                  } catch (error) {
                    toast({
                      title: 'Erro de validação!',
                      description: error instanceof Error ? error.message : 'Dados inválidos',
                      variant: 'destructive',
                    });
                  }
                }
              }}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={createStudent.isPending || updateStudent.isPending}
            />
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total de Estudantes</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Masculino</p>
                <p className="text-2xl font-bold text-blue-600">{maleStudents}</p>
                <p className="text-xs text-muted-foreground">{totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Feminino</p>
                <p className="text-2xl font-bold text-pink-600">{femaleStudents}</p>
                <p className="text-xs text-muted-foreground">{totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Idade Média</p>
                <p className="text-2xl font-bold">{avgAge} anos</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Pesquisar por nome, número, encarregado, província ou município..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={filteredStudents.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar ({filteredStudents.length})
              </Button>
            </div>
            
            {showFilters && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Filtros Avançados</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Limpar Filtros
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Província</label>
                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as províncias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as províncias</SelectItem>
                        {provinces.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Classe</label>
                    <Select value={filterClass} onValueChange={setFilterClass} disabled={classesLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={classesLoading ? "Carregando..." : "Todas as classes"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as classes</SelectItem>
                        {Array.isArray(classes) && classes.map((classItem: any) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} - {classItem.shift === 'MORNING' ? 'Manhã' : classItem.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sexo</label>
                    <Select value={filterGender} onValueChange={setFilterGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMININO">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela Melhorada de Estudantes */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="py-3 border-b">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            Lista de Estudantes ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-muted-foreground">Carregando estudantes...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <UserCircle className="h-12 w-12 text-destructive/50" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">Erro ao carregar estudantes</p>
                <p className="text-sm text-muted-foreground">
                  {error?.response?.status === 401 
                    ? 'Você precisa fazer login para acessar esta página'
                    : 'Verifique se o servidor backend está em execução na porta 3000'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {error?.response?.data?.message || error.message || 'Erro de conexão com a API'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: '480px', minHeight: '300px' }}>
              <Table>
                <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                  <TableRow>
                    <TableHead className="w-2/5">Estudante</TableHead>
                    <TableHead className="w-1/5">Número</TableHead>
                    <TableHead className="w-1/4">Classe</TableHead>
                    <TableHead className="w-1/6">Estado</TableHead>
                    <TableHead className="w-1/6 text-center">{user?.role === 'PROFESSOR' ? 'Ver' : 'Ações'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum estudante encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.profilePhotoUrl || ""} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white font-semibold">
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div 
                              className="font-medium text-primary underline cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handlePreviewStudent(student)}
                            >
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              {student.gender}
                              <span className="mx-1">•</span>
                              <span className="flex items-center gap-1">
                                <IdCard className="w-3 h-3" />
                                {student.biNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="secondary" className="font-mono">
                          {student.studentNumber}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-primary" />
                          {student.schoolClass ? (
                            <div>
                              <div className="font-medium">{student.schoolClass.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {student.schoolClass.shift === 'MORNING' ? 'Manhã' : 
                                 student.schoolClass.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem classe</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge 
                          variant="default" 
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-2">
                          {/* Botões para ADMIN e SECRETARIA apenas */}
                          {user?.role === 'ADMIN' || user?.role === 'SECRETARIA' ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                title="Editar estudante"
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                title="Remover estudante"
                                onClick={() => handleDeleteStudent(student.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : user?.role === 'PROFESSOR' ? (
                            /* Botão apenas para PROFESSOR */
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Ver detalhes do estudante"
                              onClick={() => handlePreviewStudent(student)}
                            >
                              <UserCircle className="w-4 h-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Preview do Estudante */}
      {selectedStudent && (
        <StudentFullProfileModal
          student={selectedStudent}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}

// Componente do formulário de estudante
interface StudentFormProps {
  editingStudent: Student | null;
  classes: any[];
  classesLoading: boolean;
  provinces: string[];
  municipiosPorProvincia: Record<string, string[]>;
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function StudentForm({ 
  editingStudent, 
  classes, 
  classesLoading, 
  provinces, 
  municipiosPorProvincia, 
  onSubmit, 
  onCancel, 
  isLoading 
}: StudentFormProps) {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      // Dados Acadêmicos
      firstName: editingStudent?.firstName || '',
      lastName: editingStudent?.lastName || '',
      studentNumber: editingStudent?.studentNumber || '',
      academicYear: editingStudent?.academicYear || '2025',
      classId: editingStudent?.classId || '',
      status: editingStudent?.status || 'ATIVO',
      
      // Identificação Pessoal
      gender: editingStudent?.gender || 'MASCULINO',
      biNumber: editingStudent?.biNumber || '',
      birthDate: editingStudent?.birthDate ? editingStudent.birthDate.split('T')[0] : '',
      
      // Localização
      municipality: editingStudent?.municipality || '',
      province: editingStudent?.province || '',
      country: editingStudent?.country || 'Angola',
      
      // Encarregado (campos obrigatórios para backend)
      guardianName: editingStudent?.guardianName || '',
      guardianPhone: editingStudent?.guardianPhone || '',
      parentEmail: editingStudent?.parentEmail || '',
      parentPhone: editingStudent?.parentPhone || '',
      
      // Campos extras opcionais (apenas frontend)
      guardianRelationship: editingStudent?.guardianRelationship || 'PAI',
      guardianId: editingStudent?.guardianId || '',
      guardianAddress: editingStudent?.guardianAddress || '',
      
      // Documentos
      profilePhotoUrl: editingStudent?.profilePhotoUrl || '',
      idDocumentUrl: editingStudent?.idDocumentUrl || '',
      studentCardUrl: editingStudent?.studentCardUrl || '',
      
      // Upload de ficheiros
      studentPhoto: undefined,
      biDocument: undefined,
      studentCard: undefined,
      
      // Tags e observações
      tags: editingStudent?.tags || [],
      observations: editingStudent?.observations || '',
    },
  });

  const watchedProvince = form.watch('province');
  const watchedAcademicYear = form.watch('academicYear');
  const municipiosDisponiveis = watchedProvince ? municipiosPorProvincia[watchedProvince] || [] : [];

  // Gerar studentNumber automaticamente
  useEffect(() => {
    if (watchedAcademicYear && !editingStudent) {
      // Simular geração automática do número do estudante
      const currentYear = watchedAcademicYear.slice(0, 4);
      const randomNumber = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
      const generatedNumber = `${currentYear}-${randomNumber}`;
      form.setValue('studentNumber', generatedNumber);
    }
  }, [watchedAcademicYear, editingStudent, form]);

  const handleSubmit = (data: StudentFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Dados Acadêmicos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Dados Acadêmicos</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="academicYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano letivo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2025" />
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
                  <FormLabel>Classe</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={classesLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={classesLoading ? "Carregando..." : "Selecione classe"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(classes) && classes.map((classItem: any) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name} - {classItem.shift === 'MORNING' ? 'Manhã' : classItem.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}
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
              name="studentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Estudante</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Gerado automaticamente" 
                      readOnly
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Estudante</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="TRANSFERIDO">Transferido</SelectItem>
                    <SelectItem value="DESISTENTE">Desistente</SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Identificação Pessoal */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <UserCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Identificação Pessoal</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primeiro nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: João" />
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
                    <Input {...field} placeholder="Ex: Silva" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de nascimento</FormLabel>
                  <FormControl>
                    <DatePicker 
                      date={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      placeholder="Selecionar data de nascimento"
                    />
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
                  <FormLabel>Sexo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
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
              name="biNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do BI *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="003456789LA042" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
        </div>

        {/* Localização */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Localização</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              name="municipality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Município</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!watchedProvince || municipiosDisponiveis.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!watchedProvince ? "Selecione província primeiro" : "Selecionar município"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {municipiosDisponiveis.map((municipio) => (
                        <SelectItem key={municipio} value={municipio}>
                          {municipio}
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

        {/* Encarregado de Educação */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <UserCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Encarregado de Educação</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do encarregado *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="guardianRelationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parentesco</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o parentesco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PAI">Pai</SelectItem>
                      <SelectItem value="MAE">Mãe</SelectItem>
                      <SelectItem value="AVO">Avô/Avó</SelectItem>
                      <SelectItem value="TIO">Tio/Tia</SelectItem>
                      <SelectItem value="IRMAO">Irmão/Irmã</SelectItem>
                      <SelectItem value="TUTOR">Tutor</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guardianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BI do Encarregado</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: 123456789LA041" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="guardianAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Morada do Encarregado</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Rua da Samba, Bairro Ingombota, Casa nº 25" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="guardianPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone do encarregado *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+244 923 456 789" />
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
                  <FormLabel>E-mail dos pais *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="email@exemplo.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="parentPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone dos pais *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+244 923 456 789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Documentos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Documentos</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Foto do Estudante */}
            <FormField
              control={form.control}
              name="studentPhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Foto do Estudante *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('studentPhoto')?.click()}
                      >
                        {field.value ? (
                          <div className="space-y-2">
                            <img 
                              src={URL.createObjectURL(field.value)} 
                              alt="Foto do estudante"
                              className="w-24 h-24 mx-auto rounded-lg object-cover"
                            />
                            <p className="text-xs text-muted-foreground">{field.value.name}</p>
                          </div>
                        ) : (
                          <>
                            <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Clique para enviar foto</p>
                            <p className="text-xs text-muted-foreground">JPG, JPEG ou PNG (máx. 5MB)</p>
                          </>
                        )}
                      </div>
                      <Input
                        id="studentPhoto"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bilhete de Identidade */}
            <FormField
              control={form.control}
              name="biDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Bilhete de Identidade *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('biDocument')?.click()}
                      >
                        {field.value ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center">
                              {field.value.type === 'application/pdf' ? (
                                <FileText className="w-12 h-12 text-red-500" />
                              ) : (
                                <img 
                                  src={URL.createObjectURL(field.value)} 
                                  alt="BI"
                                  className="w-24 h-24 mx-auto rounded-lg object-cover"
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{field.value.name}</p>
                            <p className="text-xs text-green-600">✓ Ficheiro carregado</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">PDF ou imagem do BI</p>
                            <p className="text-xs text-muted-foreground">PDF, JPG, JPEG ou PNG (máx. 5MB)</p>
                          </>
                        )}
                      </div>
                      <Input
                        id="biDocument"
                        type="file"
                        accept="application/pdf,image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cartão de Estudante */}
            <FormField
              control={form.control}
              name="studentCard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Cartão de Estudante *</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('studentCard')?.click()}
                      >
                        {field.value ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center">
                              {field.value.type === 'application/pdf' ? (
                                <FileText className="w-12 h-12 text-red-500" />
                              ) : (
                                <img 
                                  src={URL.createObjectURL(field.value)} 
                                  alt="Cartão"
                                  className="w-24 h-24 mx-auto rounded-lg object-cover"
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{field.value.name}</p>
                            <p className="text-xs text-green-600">✓ Ficheiro carregado</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">PDF ou imagem</p>
                            <p className="text-xs text-muted-foreground">PDF, JPG, JPEG ou PNG (máx. 5MB)</p>
                          </>
                        )}
                      </div>
                      <Input
                        id="studentCard"
                        type="file"
                        accept="application/pdf,image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file);
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Tags e Observações */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Tag className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Tags e Observações</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px]">
                <Input 
                  placeholder="Digite uma tag e pressione Enter..." 
                  className="border-0 focus-visible:ring-0 flex-1 min-w-[200px]" 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ex: bolseiro, atleta, monitor, líder de turma
              </p>
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Observações adicionais sobre o estudante..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Botões */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              editingStudent ? 'Atualizar' : 'Criar Estudante'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}