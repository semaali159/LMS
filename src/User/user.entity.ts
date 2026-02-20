// import { Course } from "src/courses/course.entity";
import { StudentProfile } from "../profiles/entities/student-profile.entity";
import { InstructorProfile } from "../profiles/entities/instructor-profile.entity";
import { Column, Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../common/enums/roles.enum";
// import { Enrollment } from "src/Enrollments/Enrollment.entity";
import { Exclude } from "class-transformer";
import { Course } from "src/courses/course.entity";
@Entity({"name":"users"})
export class User{
  @PrimaryGeneratedColumn('uuid')
  id:string
  @Column({type:"varchar",length:'150',unique:true})
email:string
@Column()
@Exclude()
password:string
@Column({type:"varchar",length:'150',nullable:true})
username:string
@Column({type:'enum',enum:Role, default:Role.STUDENT})
role:Role
@Column({default:false})
isAccountVerified:boolean
@Column({type: 'text',nullable:true})
  refreshToken?: string;
@Column({default:false})
isAdmin:boolean  
@OneToOne(() => StudentProfile, (profile) => profile.user, { nullable: true })
studentProfile?: StudentProfile;
@OneToOne(() => InstructorProfile, (profile) => profile.user, { nullable: true })
instructorProfile?: InstructorProfile;  
@OneToMany(()=> Course, (course)=> course.instructor)
coursesinstructor:Course[]
// // @ManyToMany(()=>Course, (course)=> course.students)
// // coursesEnrolled:Course[]
// @OneToMany(() => Enrollment, e => e.student)
// enrollments: Enrollment[];

}