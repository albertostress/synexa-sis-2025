/**
 * Library Controller - Controlador da biblioteca
 * Endpoints REST para gestão de livros e empréstimos
 */
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { CreateBookDto, CreateBookResponse } from './dto/create-book.dto';
import { LoanBookDto, LoanBookResponse } from './dto/loan-book.dto';
import { ReturnBookDto, ReturnBookResponse } from './dto/return-book.dto';
import { FilterLoansDto, FilterBooksDto, LoansListResponse, BooksListResponse } from './dto/filter-loans.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Cadastrar novo livro',
    description: 'Permite cadastrar novos livros no sistema da biblioteca',
  })
  @ApiResponse({
    status: 201,
    description: 'Livro cadastrado com sucesso',
    type: CreateBookResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para cadastrar livros (apenas ADMIN)',
  })
  @ApiResponse({
    status: 409,
    description: 'ISBN já cadastrado',
  })
  async createBook(@Body() createBookDto: CreateBookDto): Promise<CreateBookResponse> {
    return this.libraryService.createBook(createBookDto);
  }

  @Get('books')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({
    summary: 'Listar livros com filtros',
    description: 'Retorna lista paginada de livros com opções de filtro e busca',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    description: 'Buscar por título do livro',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    type: String,
    description: 'Buscar por autor do livro',
  })
  @ApiQuery({
    name: 'isbn',
    required: false,
    type: String,
    description: 'Buscar por ISBN',
  })
  @ApiQuery({
    name: 'availableOnly',
    required: false,
    type: Boolean,
    description: 'Mostrar apenas livros disponíveis',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de livros retornada com sucesso',
    type: BooksListResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar livros',
  })
  async getBooks(@Query() filters: FilterBooksDto): Promise<BooksListResponse> {
    return this.libraryService.getBooks(filters);
  }

  @Get('books/:id')
  @Roles('ADMIN', 'SECRETARIA', 'DIRETOR', 'PROFESSOR')
  @ApiOperation({
    summary: 'Ver detalhes de um livro',
    description: 'Retorna informações detalhadas de um livro específico incluindo disponibilidade',
  })
  @ApiParam({
    name: 'id',
    description: 'ID do livro',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do livro retornados com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar livro',
  })
  @ApiResponse({
    status: 404,
    description: 'Livro não encontrado',
  })
  async getBookById(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.getBookById(id);
  }

  @Post('loan')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({
    summary: 'Fazer empréstimo de livro',
    description: 'Registra empréstimo de livro para aluno ou professor',
  })
  @ApiResponse({
    status: 201,
    description: 'Empréstimo realizado com sucesso',
    type: LoanBookResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou livro não disponível',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para fazer empréstimos (apenas ADMIN/SECRETARIA)',
  })
  @ApiResponse({
    status: 404,
    description: 'Livro, aluno ou professor não encontrado',
  })
  async loanBook(@Body() loanBookDto: LoanBookDto): Promise<LoanBookResponse> {
    return this.libraryService.loanBook(loanBookDto);
  }

  @Post('return/:loanId')
  @Roles('ADMIN', 'SECRETARIA')
  @ApiOperation({
    summary: 'Marcar devolução de livro',
    description: 'Processa devolução de livro emprestado',
  })
  @ApiParam({
    name: 'loanId',
    description: 'ID do empréstimo',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Devolução processada com sucesso',
    type: ReturnBookResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Livro já foi devolvido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para processar devoluções (apenas ADMIN/SECRETARIA)',
  })
  @ApiResponse({
    status: 404,
    description: 'Empréstimo não encontrado',
  })
  async returnBook(
    @Param('loanId', ParseUUIDPipe) loanId: string,
    @Body() returnBookDto: ReturnBookDto = {},
  ): Promise<ReturnBookResponse> {
    return this.libraryService.returnBook(loanId, returnBookDto);
  }

  @Get('loans')
  @Roles('ADMIN', 'DIRETOR')
  @ApiOperation({
    summary: 'Histórico de empréstimos',
    description: 'Retorna lista paginada de empréstimos com filtros avançados',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'RETURNED', 'OVERDUE'],
    description: 'Filtrar por status do empréstimo',
  })
  @ApiQuery({
    name: 'studentId',
    required: false,
    type: String,
    description: 'ID do aluno para filtrar',
  })
  @ApiQuery({
    name: 'teacherId',
    required: false,
    type: String,
    description: 'ID do professor para filtrar',
  })
  @ApiQuery({
    name: 'bookId',
    required: false,
    type: String,
    description: 'ID do livro para filtrar',
  })
  @ApiQuery({
    name: 'startLoanDate',
    required: false,
    type: String,
    description: 'Data de início do empréstimo (ISO string)',
  })
  @ApiQuery({
    name: 'endLoanDate',
    required: false,
    type: String,
    description: 'Data de fim do empréstimo (ISO string)',
  })
  @ApiQuery({
    name: 'startDueDate',
    required: false,
    type: String,
    description: 'Data de início do vencimento (ISO string)',
  })
  @ApiQuery({
    name: 'endDueDate',
    required: false,
    type: String,
    description: 'Data de fim do vencimento (ISO string)',
  })
  @ApiQuery({
    name: 'searchBook',
    required: false,
    type: String,
    description: 'Buscar por título do livro',
  })
  @ApiQuery({
    name: 'searchBorrower',
    required: false,
    type: String,
    description: 'Buscar por nome do emprestário',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Itens por página (padrão: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empréstimos retornada com sucesso',
    type: LoansListResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar histórico (apenas ADMIN/DIRETOR)',
  })
  async getLoans(@Query() filters: FilterLoansDto): Promise<LoansListResponse> {
    return this.libraryService.getLoans(filters);
  }

  @Get('my-loans')
  @Roles('PROFESSOR')
  @ApiOperation({
    summary: 'Meus empréstimos (professores)',
    description: 'Retorna lista de empréstimos do professor logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empréstimos do professor retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas professores podem acessar este endpoint',
  })
  @ApiResponse({
    status: 404,
    description: 'Professor não encontrado',
  })
  async getMyLoans(@Request() req: any) {
    return this.libraryService.getUserLoans(req.user.id, req.user.role);
  }
}