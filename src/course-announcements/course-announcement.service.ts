import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CourseAnnouncement } from "./entities/course-announcement.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CourseAnnouncementRead } from "./entities/course-announcement-read.entity";
import { Course } from "src/courses/course.entity";
import { Enrollment } from "src/Enrollments/Enrollment.entity";
import { EnrollmentService } from "src/Enrollments/Enrollment.service";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreateCourseAnnouncementDTO } from "./dtos/create-course-annoucement.dto";
import { User } from "src/User/user.entity";
import { title } from "process";

@Injectable()
export class CourseAnnouncementService{
    constructor(
        @InjectRepository(CourseAnnouncement)
        private readonly announcementRepo:Repository <CourseAnnouncement>,
        @InjectRepository(CourseAnnouncementRead)
        private readonly readRepo :Repository <CourseAnnouncementRead>,
        @InjectRepository(Course)
        private readonly courseRepo: Repository<Course>,
        @InjectRepository(Enrollment)
        private readonly enrollmentRepo: Repository <Enrollment>,
        private readonly enrollmentService: EnrollmentService,
        private readonly eventEmitter: EventEmitter2
    ){}

     async create(courseId:number,instructorId:string,dto: CreateCourseAnnouncementDTO){

        const course = await this.courseRepo.findOne({
        where:{id:courseId},
        relations:['instructor']
       })
       if(!course) throw new NotFoundException('Course not found')
       if(course.instructor.id !== instructorId) throw new ForbiddenException('Not allowed only course instructor can post annoucement')
       const author = await this.courseRepo.manager.findOne(User,{
       where:{id:instructorId}
       })
       if(!author) throw new NotFoundException('Instructor not found')
       const announcement =  this.announcementRepo.create({
       course,
       author,
       ...dto
    //    title: dto.title,
    //    body:dto.body,
    //    sessionId: dto.sessionUrl ?? null,
    //    pinned: dto.pinned ?? false 
           })
        const saved = await this.announcementRepo.save(announcement)
        this.eventEmitter.emit('announcement.created',{
            announcementId: saved.id,
            courseId,
            title: saved.title ?? 'Announcement',

        })   
        return saved
     }
     async listForStudent(courseId: number, studentId: string) {
  return await this.announcementRepo
    .createQueryBuilder('a')
    .leftJoin('a.reads', 'r', 'r.userId = :studentId', { studentId })
    .where('a.courseId = :courseId', { courseId })
    .orderBy('a.pinned', 'DESC')
    .addOrderBy('a.createdAt', 'DESC')
    .select([
      'a.id AS id',
      'a.title AS title',
      'a.body AS body',
      'a.pinned AS pinned',
      'a.createdAt AS createdAt',
    ])
    .addSelect('CASE WHEN r.id IS NOT NULL THEN true ELSE false END', 'readByMe')
    .getRawMany();
}
    
    async listForCourseInstructor(courseId:number, instructorId:string){
        const course = await this.courseRepo.findOne({
            where:{id: courseId},
            relations:['instructor']
        })
        if(!course) throw new NotFoundException('Course not found')
        if(course.instructor.id !== instructorId) throw new ForbiddenException('Not allowed only instructor course')
        const announcements = await this.announcementRepo.createQueryBuilder('a')
        .leftJoinAndSelect('a.author','author')
        .leftJoin('announcement_read','r','r.announcementId=a.id')
        .leftJoin('enrollment','e','e.courseId = :courseId AND e.status = :status',{courseId, status:'ACTIVE'})
        .where('a.courseId = :courseId',{courseId})
        .select([
            'a.id','a.title','a.body','a.pinned','a.createdAt',
        ])
        .addSelect('COUNT(DISTINCT e.id)','activeEnrolledStudents')
        .addSelect('COUNT(DISTINCT r.id)', 'readCount')
        .orderBy('a.pinned','DESC')
        .addOrderBy('a.createdAt','DESC')
        .getRawMany()

        return announcements
    }
    async getAnnouncement(announcementId: number, studentId: string ){
        const announcement = await this.announcementRepo.findOne({
            where:{id: announcementId},
            relations:['course']
        })
        if(!announcement){
            throw new NotFoundException('Announcement not found')
        }
        await this.enrollmentService.getActiveEnrollmentOrFail(studentId,announcement.course.id)
        await this.markRead(announcementId,studentId)
    }
    async markRead(announcementId:number,studentId:string){
        const read = this.readRepo.create({
            announcement:{id:announcementId},
            user:{id:studentId}
            })
            try{
                await this.readRepo.save(read)
            }catch(err){

            }
    }
}
// list announcement without Query Builder
// async listForEnrollmentStudent(courseId: number, studentId: string){
//         await this.enrollmentService.getActiveEnrollmentOrFail(studentId,courseId)
//         const announcement = await this.annoucementRepo.find({
//             where:{course : {id:courseId}},
//             relations:['author'],
//             order:{pinned:'DESC', createdAt:'DESC'}
//         })
//         if(announcement.length= 0){
//             throw new NotFoundException('There is no announcement yet')
//         }
//         const reads = await this.readRepo.find({
//             where:{user:{id:studentId}},
//             relations:['announcement', 'announcement.course']
//         })
//         const readSet = new Set(reads
//             .filter((r)=> r.announcement?.course?.id === courseId)
//             .map((r)=> r.announcement.id)
//         )

//         return announcement.map((a)=>({
//             ...a,
//             readByMe: readSet.has(a.id)
//         }))
//     }

// async listForCourseInstructor(courseId:number, instructorId:string){
//         const course = await this.courseRepo.findOne({
//             where:{id: courseId},
//             relations:['instructor']
//         })
//         if(!course) throw new NotFoundException('Course not found')
//         if(course.instructor.id !== instructorId) throw new ForbiddenException('Not allowed only instructor course')
//         const annoucement = await this.announcementRepo.find({
//             where:{course:{id:courseId} },
//             relations:['author'],
//             order: { pinned: 'DESC', createdAt: 'DESC' },
// })
//         const activeCount = await this.enrollmentRepo.count({
//             where:{course:{id:courseId}, status: 'ACTIVE'},
//         })

//         const withStats = await Promise.all(
//             annoucement.map(async(a)=>{
//                 const readCount = await this.readRepo.count({
//                     where:{announcement:{id: a.id}}
//                 })
//                 return { ...a, 
//                         readCount,
//                         activeEnrolledStudents: activeCount
//                         }
//             })
//         )
//         return withStats
//     }
