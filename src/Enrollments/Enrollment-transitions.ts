import { BadRequestException } from "@nestjs/common";
import { EnrollmentStatus } from "src/common/enums/enrollmentStatus.enum";

const TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  [EnrollmentStatus.PENDING]: [
    EnrollmentStatus.ACTIVE,
    EnrollmentStatus.REJECTED,
    EnrollmentStatus.CANCELLED,
  ],
  [EnrollmentStatus.WAITLISTED]: [
    EnrollmentStatus.PENDING,
    EnrollmentStatus.CANCELLED,
  ],
  [EnrollmentStatus.ACTIVE]: [
    EnrollmentStatus.DROPPED,
    EnrollmentStatus.COMPLETED,
  ],
  [EnrollmentStatus.REJECTED]: [],
  [EnrollmentStatus.CANCELLED]: [],
  [EnrollmentStatus.DROPPED]: [],
  [EnrollmentStatus.COMPLETED]: [],
};

export function assertTransition(current: EnrollmentStatus, target: EnrollmentStatus): void {
  const allowed = TRANSITIONS[current] ?? [];
  if (!allowed.includes(target)) {
    throw new BadRequestException(`Invalid enrollment transition from ${current} to ${target}`);
  }
}
