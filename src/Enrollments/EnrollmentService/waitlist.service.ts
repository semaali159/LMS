import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EnrollmentStatus } from "src/common/enums/enrollmentStatus.enum";
import { EntityManager } from "typeorm";
import { Enrollment } from "../Enrollment.entity";

@Injectable()
export class WaitlistService{
    constructor(
        private readonly evevntEmitter: EventEmitter2
    ){}


    async getNextPosition(manager:EntityManager,courseId:number): Promise<number>{
        const lastWaitlisted = await manager.findOne(Enrollment,{
            where:{course:{id:courseId},status:EnrollmentStatus.WAITLISTED},
            order:{waitlistPosition:'DESC'},
            select:{waitlistPosition:true}
        })

        return (lastWaitlisted?.waitlistPosition ?? 0)+1

    }

    async shiftPositionsDown(
        manager:EntityManager,
        courseId:number,
        afterPosition:number
    ):Promise<void>{
        await manager
           .createQueryBuilder()
           .update(Enrollment)
           .set({waitlistPosition:() =>"waitlist_position - 1"})
           .where("course_id = :courseId", {courseId})
           .andWhere("status = :status", {status: EnrollmentStatus.WAITLISTED})
           .andWhere("waitlist_production > :position", {position:afterPosition})
           .execute()
    }

    async prompteNext(
        manager:EntityManager,
        courseId: number,
        requiresApproval:boolean
    ):Promise<{enrollmentId:number; newStatus: EnrollmentStatus} | null >{
        const firstWaitlisted = await manager.findOne(Enrollment,{
            where:{course:{id:courseId}, status:EnrollmentStatus.WAITLISTED},
            order:{waitlistPosition:'ASC'},
            select:{id:true, waitlistPosition:true}
        })
        if(!firstWaitlisted) return null
        const newStatus = requiresApproval ? EnrollmentStatus.PENDING : EnrollmentStatus.ACTIVE

        await manager.update(Enrollment,{id: firstWaitlisted.id},{
            status:newStatus,
            waitlistPosition: null
            
        })
        await this.shiftPositionsDown(manager,courseId,firstWaitlisted.waitlistPosition!)
        this.evevntEmitter.emit(
            newStatus === EnrollmentStatus.ACTIVE 
            ? "enrollment.activated_from_waitlist"
            : "enrollment.promoted_from_waitlist",
            {EnrollmentId: firstWaitlisted.id, courseId}
        )
        return{enrollmentId:firstWaitlisted.id,newStatus}

    }
}
