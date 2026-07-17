import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Enrollment } from "../Enrollment.entity";
import { EnrollmentAuthService } from "./EnrollmentAuth.service";
import { buildOffset, normalizeOffset, offsetPaginationInput } from "src/common/services/pagination";
import { EnrollmentStatus } from "src/common/enums/enrollmentStatus.enum";
import { plainToInstance } from "class-transformer";
import { EnrollmentWithStudentDto } from "../dtos/enrollment.dto";
import { assertTransition } from "../Enrollment-transitions";
import { weightSrvRecords } from "ioredis/built/cluster/util";
import { BadRequestException } from "@nestjs/common";

export class EnrollmentQueryService{
    constructor(
        private readonly eventEmitter : EventEmitter2,
        private readonly dataSource : DataSource,
        @InjectRepository(Enrollment) private readonly enrollmentRepo : Repository<Enrollment>,
        private readonly authService : EnrollmentAuthService 
    ){}

        async getPendingEnrollment(
            courseId:number,
            instructorId:string,
            pagination:offsetPaginationInput
        ){
            await this.authService.assertOwnsCourse(courseId,instructorId)
            return this.listByStatus(courseId,EnrollmentStatus.PENDING,"enrolledAt","ASC", pagination)

        }

        async getWaitlistedEnrollments(
            courseId: number,
            instructorId: string,
            pagination:offsetPaginationInput
        ){
            await this.authService.assertOwnsCourse(courseId,instructorId)
            await this.listByStatus(courseId,EnrollmentStatus.WAITLISTED,"waitlistPosition","DESC",pagination)
        }

        async acceptEnrollment(enrollmentId:number, instructorId:string){
            return this.dataSource.transaction(async(manager)=>{
                const enrollment = await this.authService.loadOwnedEnrollmentOrFail(
                    manager,
                    enrollmentId,
                    instructorId,
                    {capacity:true},
                    {mode:"pessimistic_write"}
                )
                assertTransition(enrollment.status, EnrollmentStatus.ACTIVE)
                if(enrollment.course.capacity !== null){
                    const activeCount = await manager.count(Enrollment,{
                        where:{course:{id: enrollment.course.id}, status:EnrollmentStatus.ACTIVE},
                    })
                    if(activeCount >= enrollment.course.capacity){
                        throw new BadRequestException('Cannot accept/; course is at full capacity')
                    }
                }
                enrollment.status = EnrollmentStatus.ACTIVE;
                enrollment.waitlistPosition = null 
                const saved = await manager.save(enrollment)

                this.eventEmitter.emit('enrollment.accepted',{
                    enrollmentId,
                    courseId: enrollment.course.id
                })

                return plainToInstance(EnrollmentWithStudentDto, saved, {excludeExtraneousValues:true})


            })
        }

        async rejectEnrollment(enrollmentId:number, instructorId:string){
            const enrollment = await this.authService.loadOwnedEnrollmentOrFail(
                this.dataSource.manager,
                enrollmentId,
                instructorId
            )
            assertTransition(enrollment.status, EnrollmentStatus.REJECTED)
            enrollment.status = EnrollmentStatus.REJECTED
            enrollment.rejectedAt = new Date()
            const saved  =await this.enrollmentRepo.save(enrollment)

            this.eventEmitter.emit('enrollment.rejected',{
                enrollmentId,
                courseId: enrollment.course.id
            })

            return plainToInstance(EnrollmentWithStudentDto,saved,{excludeExtraneousValues:true})
        }

        private async listByStatus(
            courseId:number,
            status:EnrollmentStatus,
            orderField:"enrolledAt" | "waitlistPosition",
            orderDir: "ASC" | "DESC",
            pagination: offsetPaginationInput
        ){
            const {page,limit,skip,take} = normalizeOffset(pagination)
            const [enrollments, totalItems] = await this.enrollmentRepo.findAndCount({
                where:{course:{id:courseId}, status},
                relations:["student"],
                select:{
                    id:true,
                    status: true,
                    enrolledAt:true,
                    waitlistPosition:true,
                    student:{id:true,username:true}
                },
                order:{[orderField]:orderDir} as any,
                skip,
                take
            })
            const dtos = plainToInstance(EnrollmentWithStudentDto, enrollments, {excludeExtraneousValues:true})
            return buildOffset(dtos,totalItems,page,limit)
        }

}