import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student } from '@prisma/client';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const { name, email, birthDate } = createStudentDto;
    
    return await this.prisma.student.create({
      data: {
        name,
        email,
        birthDate: new Date(birthDate),
      },
    });
  }

  async findAll(): Promise<Student[]> {
    return await this.prisma.student.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException(`Aluno com ID ${id} não encontrado`);
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    await this.findOne(id);

    const updateData: Record<string, unknown> = {};
    
    if (updateStudentDto.name !== undefined) {
      updateData.name = updateStudentDto.name;
    }
    
    if (updateStudentDto.email !== undefined) {
      updateData.email = updateStudentDto.email;
    }
    
    if (updateStudentDto.birthDate !== undefined) {
      updateData.birthDate = new Date(updateStudentDto.birthDate);
    }

    return await this.prisma.student.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string): Promise<Student> {
    await this.findOne(id);

    return await this.prisma.student.delete({
      where: { id },
    });
  }
}