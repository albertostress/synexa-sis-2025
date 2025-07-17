import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateScheduleDto, Weekday } from './create-schedule.dto';
import { IsOptional, IsUUID, IsString, Matches, IsEnum } from 'class-validator';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}