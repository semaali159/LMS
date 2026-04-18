import { Course } from "src/courses/course.entity";
import { User } from "src/User/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CourseAnnouncementRead } from "./course-announcement-read.entity";

@Entity()
export class CourseAnnouncement{
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    body: string

    @Column({type:'varchar', nullable: true })
    sessionUrl: string

    @Column({default: false})
    pinned: boolean

    @CreateDateColumn()
    createdAt: Date

    @ManyToOne(()=> Course,{onDelete: 'CASCADE'})
    course: Course

    @ManyToOne(()=> User, {onDelete:'CASCADE'})
    author: User

    @OneToMany(()=> CourseAnnouncementRead , (r)=> r.announcement)
    reads: CourseAnnouncementRead[]

}