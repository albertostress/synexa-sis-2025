/**
 * Library Service - Serviço de biblioteca
 * Lógica de negócio para gestão de livros e empréstimos
 */
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, CreateBookResponse } from './dto/create-book.dto';
import { LoanBookDto, LoanBookResponse } from './dto/loan-book.dto';
import { ReturnBookDto, ReturnBookResponse } from './dto/return-book.dto';
import { FilterLoansDto, FilterBooksDto, LoansListResponse, BooksListResponse } from './dto/filter-loans.dto';
import { LoanStatus } from './entities/loan.entity';

@Injectable()
export class LibraryService {
  private readonly MAX_ACTIVE_LOANS = 3; // Máximo de livros por pessoa
  private readonly DEFAULT_LOAN_DAYS = 15; // Prazo padrão de empréstimo

  constructor(private readonly prisma: PrismaService) {}

  // Criar novo livro
  async createBook(createBookDto: CreateBookDto): Promise<CreateBookResponse> {
    // Verificar se o ISBN já existe
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: createBookDto.isbn },
    });

    if (existingBook) {
      throw new ConflictException('Já existe um livro com este ISBN');
    }

    const book = await this.prisma.book.create({
      data: {
        title: createBookDto.title,
        author: createBookDto.author,
        isbn: createBookDto.isbn,
        copies: createBookDto.copies || 1,
      },
    });

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      copies: book.copies,
      createdAt: book.createdAt,
      message: 'Livro cadastrado com sucesso',
    };
  }

  // Listar livros com filtros
  async getBooks(filters: FilterBooksDto): Promise<BooksListResponse> {
    const { page = 1, limit = 10, ...searchFilters } = filters;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (searchFilters.title) {
      whereConditions.title = {
        contains: searchFilters.title,
        mode: 'insensitive',
      };
    }

    if (searchFilters.author) {
      whereConditions.author = {
        contains: searchFilters.author,
        mode: 'insensitive',
      };
    }

    if (searchFilters.isbn) {
      whereConditions.isbn = {
        contains: searchFilters.isbn,
        mode: 'insensitive',
      };
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
        include: {
          loans: {
            where: { status: LoanStatus.ACTIVE },
            select: { id: true },
          },
        },
      }),
      this.prisma.book.count({
        where: whereConditions,
      }),
    ]);

    // Calcular livros disponíveis
    const booksWithAvailability = books.map(book => {
      const activeLoans = book.loans.length;
      const available = book.copies - activeLoans;
      
      return {
        ...book,
        activeLoans,
        available,
        loans: undefined, // Remove dos dados de resposta
      };
    });

    // Filtrar apenas disponíveis se solicitado
    let filteredBooks = booksWithAvailability;
    if (searchFilters.availableOnly) {
      filteredBooks = booksWithAvailability.filter(book => book.available > 0);
    }

    return {
      books: filteredBooks,
      total: searchFilters.availableOnly ? filteredBooks.length : total,
      page,
      limit,
      totalPages: Math.ceil((searchFilters.availableOnly ? filteredBooks.length : total) / limit),
    };
  }

  // Obter detalhes de um livro
  async getBookById(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        loans: {
          where: { status: LoanStatus.ACTIVE },
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
            teacher: {
              select: { id: true, user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Livro não encontrado');
    }

    const activeLoans = book.loans.length;
    const available = book.copies - activeLoans;

    return {
      ...book,
      activeLoans,
      available,
    };
  }

  // Fazer empréstimo
  async loanBook(loanBookDto: LoanBookDto): Promise<LoanBookResponse> {
    const { bookId, studentId, teacherId, dueDate } = loanBookDto;

    // Validar que é especificado aluno OU professor, não ambos
    if ((!studentId && !teacherId) || (studentId && teacherId)) {
      throw new BadRequestException('Deve especificar apenas aluno OU professor');
    }

    // Verificar se o livro existe e está disponível
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        loans: {
          where: { status: LoanStatus.ACTIVE },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Livro não encontrado');
    }

    const activeLoans = book.loans.length;
    const available = book.copies - activeLoans;

    if (available <= 0) {
      throw new BadRequestException('Livro não disponível para empréstimo');
    }

    // Verificar se aluno/professor existe
    let borrower: any;
    let borrowerType: 'student' | 'teacher';

    if (studentId) {
      borrower = await this.prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!borrower) {
        throw new NotFoundException('Aluno não encontrado');
      }

      borrowerType = 'student';

      // Verificar limite de empréstimos do aluno
      const studentActiveLoans = await this.prisma.loan.count({
        where: {
          studentId,
          status: LoanStatus.ACTIVE,
        },
      });

      if (studentActiveLoans >= this.MAX_ACTIVE_LOANS) {
        throw new BadRequestException(`Aluno já possui o máximo de ${this.MAX_ACTIVE_LOANS} livros emprestados`);
      }
    } else {
      borrower = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        include: {
          user: { select: { name: true, email: true } },
        },
      });

      if (!borrower) {
        throw new NotFoundException('Professor não encontrado');
      }

      borrowerType = 'teacher';

      // Verificar limite de empréstimos do professor
      const teacherActiveLoans = await this.prisma.loan.count({
        where: {
          teacherId,
          status: LoanStatus.ACTIVE,
        },
      });

      if (teacherActiveLoans >= this.MAX_ACTIVE_LOANS) {
        throw new BadRequestException(`Professor já possui o máximo de ${this.MAX_ACTIVE_LOANS} livros emprestados`);
      }
    }

    // Calcular data de vencimento
    const loanDate = new Date();
    const calculatedDueDate = dueDate
      ? new Date(dueDate)
      : new Date(loanDate.getTime() + this.DEFAULT_LOAN_DAYS * 24 * 60 * 60 * 1000);

    // Criar empréstimo
    const loan = await this.prisma.loan.create({
      data: {
        bookId,
        studentId,
        teacherId,
        status: LoanStatus.ACTIVE,
        loanDate,
        dueDate: calculatedDueDate,
      },
      include: {
        book: {
          select: { id: true, title: true, author: true, isbn: true },
        },
      },
    });

    return {
      id: loan.id,
      bookId: loan.bookId,
      borrowerId: studentId || teacherId!,
      borrowerType,
      status: loan.status,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      book: loan.book,
      message: 'Empréstimo realizado com sucesso',
    };
  }

  // Devolver livro
  async returnBook(loanId: string, returnBookDto: ReturnBookDto = {}): Promise<ReturnBookResponse> {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        book: {
          select: { id: true, title: true, author: true, isbn: true },
        },
        student: {
          select: { id: true, name: true },
        },
        teacher: {
          select: { id: true, user: { select: { name: true } } },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Empréstimo não encontrado');
    }

    if (loan.status === LoanStatus.RETURNED) {
      throw new BadRequestException('Este livro já foi devolvido');
    }

    const returnDate = returnBookDto.returnDate ? new Date(returnBookDto.returnDate) : new Date();
    const wasOverdue = returnDate > loan.dueDate;
    const daysOverdue = wasOverdue
      ? Math.ceil((returnDate.getTime() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    // Atualizar empréstimo
    const updatedLoan = await this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.RETURNED,
        returnDate,
      },
    });

    // Preparar dados do emprestário
    let borrower: any;
    if (loan.student) {
      borrower = {
        id: loan.student.id,
        name: loan.student.name,
        type: 'student' as const,
      };
    } else if (loan.teacher) {
      borrower = {
        id: loan.teacher.id,
        name: loan.teacher.user.name,
        type: 'teacher' as const,
      };
    }

    return {
      id: updatedLoan.id,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      returnDate,
      wasOverdue,
      daysOverdue,
      book: loan.book,
      borrower,
      message: wasOverdue 
        ? `Livro devolvido com ${daysOverdue} dias de atraso`
        : 'Livro devolvido com sucesso',
    };
  }

  // Listar empréstimos com filtros
  async getLoans(filters: FilterLoansDto): Promise<LoansListResponse> {
    const { page = 1, limit = 10, ...searchFilters } = filters;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (searchFilters.status) {
      whereConditions.status = searchFilters.status;
    }

    if (searchFilters.studentId) {
      whereConditions.studentId = searchFilters.studentId;
    }

    if (searchFilters.teacherId) {
      whereConditions.teacherId = searchFilters.teacherId;
    }

    if (searchFilters.bookId) {
      whereConditions.bookId = searchFilters.bookId;
    }

    if (searchFilters.startLoanDate || searchFilters.endLoanDate) {
      whereConditions.loanDate = {};
      if (searchFilters.startLoanDate) {
        whereConditions.loanDate.gte = new Date(searchFilters.startLoanDate);
      }
      if (searchFilters.endLoanDate) {
        whereConditions.loanDate.lte = new Date(searchFilters.endLoanDate);
      }
    }

    if (searchFilters.startDueDate || searchFilters.endDueDate) {
      whereConditions.dueDate = {};
      if (searchFilters.startDueDate) {
        whereConditions.dueDate.gte = new Date(searchFilters.startDueDate);
      }
      if (searchFilters.endDueDate) {
        whereConditions.dueDate.lte = new Date(searchFilters.endDueDate);
      }
    }

    // Filtros de busca por texto
    if (searchFilters.searchBook) {
      whereConditions.book = {
        title: {
          contains: searchFilters.searchBook,
          mode: 'insensitive',
        },
      };
    }

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { loanDate: 'desc' },
        include: {
          book: {
            select: { id: true, title: true, author: true, isbn: true },
          },
          student: {
            select: { id: true, name: true, email: true },
          },
          teacher: {
            select: { id: true, user: { select: { name: true, email: true } } },
          },
        },
      }),
      this.prisma.loan.count({
        where: whereConditions,
      }),
    ]);

    // Processar loans para incluir informações calculadas
    const processedLoans = loans.map(loan => {
      const now = new Date();
      let calculatedStatus = loan.status;

      // Calcular status OVERDUE se necessário
      if (loan.status === LoanStatus.ACTIVE && now > loan.dueDate) {
        calculatedStatus = LoanStatus.OVERDUE;
      }

      const daysOverdue = loan.status === LoanStatus.ACTIVE && now > loan.dueDate
        ? Math.ceil((now.getTime() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000))
        : 0;

      return {
        ...loan,
        status: calculatedStatus,
        daysOverdue,
        borrower: loan.student ? {
          id: loan.student.id,
          name: loan.student.name,
          email: loan.student.email,
          type: 'student',
        } : loan.teacher ? {
          id: loan.teacher.id,
          name: loan.teacher.user.name,
          email: loan.teacher.user.email,
          type: 'teacher',
        } : null,
      };
    });

    return {
      loans: processedLoans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Atualizar status de empréstimos vencidos
  async updateOverdueLoans(): Promise<void> {
    const now = new Date();
    
    await this.prisma.loan.updateMany({
      where: {
        status: LoanStatus.ACTIVE,
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: LoanStatus.OVERDUE,
      },
    });
  }

  // Obter empréstimos de um usuário específico (para professores verem seus próprios)
  async getUserLoans(userId: string, userRole: string): Promise<any[]> {
    let whereConditions: any = {};

    if (userRole === 'PROFESSOR') {
      // Buscar teacher pelo userId
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId },
      });

      if (!teacher) {
        throw new NotFoundException('Professor não encontrado');
      }

      whereConditions.teacherId = teacher.id;
    } else {
      throw new BadRequestException('Apenas professores podem usar este endpoint');
    }

    const loans = await this.prisma.loan.findMany({
      where: whereConditions,
      orderBy: { loanDate: 'desc' },
      include: {
        book: {
          select: { id: true, title: true, author: true, isbn: true },
        },
      },
    });

    // Processar para incluir status calculado
    return loans.map(loan => {
      const now = new Date();
      let calculatedStatus = loan.status;

      if (loan.status === LoanStatus.ACTIVE && now > loan.dueDate) {
        calculatedStatus = LoanStatus.OVERDUE;
      }

      const daysOverdue = loan.status === LoanStatus.ACTIVE && now > loan.dueDate
        ? Math.ceil((now.getTime() - loan.dueDate.getTime()) / (24 * 60 * 60 * 1000))
        : 0;

      return {
        ...loan,
        status: calculatedStatus,
        daysOverdue,
      };
    });
  }
}