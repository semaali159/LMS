import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Course } from "src/courses/course.entity";
import { EntityManager, Repository } from "typeorm";
import { Enrollment } from "../Enrollment.entity";

export class EnrollmentAuthService{
    constructor(
        @InjectRepository(Course) private readonly courseeRepo: Repository<Course>
    ){}

    async assertOwnsCourse(courseId:number,instructorId:string):Promise<void>{
        const course  = await this.courseeRepo.findOne({
            where:{id:courseId,instructor:{id: instructorId}},
            select:{id:true}
        })
        if(!course) throw new ForbiddenException('not allowed')
    }

    async loadOwnedEnrollmentOrFail(
        manager:EntityManager,
        enrollmentId:number,
        instructorId:string,
        extraCourseSelect: Record<string,any> ={},
        lock?:{mode:"pessimistic_write"}
    ):Promise<Enrollment>{
        const enrollment = await manager.findOne(Enrollment,{
            where:{id:enrollmentId},
            relations:["course","course.instructor"],
            select:{
                id:true,
                status:true,
                course:{id:true, instructor:{id:true},...extraCourseSelect}
            },
            ...(lock? {lock}:{})
        })
        if(!enrollment) throw new NotFoundException("Enrollment not found")
        if(enrollment.course.instructor.id !== instructorId){
            throw new ForbiddenException("Only the course owner can manage enrollments ")
        }    
        return enrollment
    }
}