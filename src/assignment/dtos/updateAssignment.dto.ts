import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './createAssignment.dto';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}
