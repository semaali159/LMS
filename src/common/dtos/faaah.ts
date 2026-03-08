
// // import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// // import { ConfigService } from '@nestjs/config';

// // @Injectable()
// // export class StorageService {
// //   private s3Client: S3Client;
// //   private readonly bucketName = 'media';

// //   constructor(private configService: ConfigService) {
// //     this.s3Client = new S3Client({
// //       endpoint: this.configService.get<string>('storage.endpoint')!,
// //       region: 'auto',
// //       credentials: {
// //         accessKeyId: this.configService.get<string>('storage.api_key')!,
// //         secretAccessKey: this.configService.get<string>('storage.api_secret')!,
// //       },
// //       forcePathStyle: true,
// //     });
// //   }

// //   /**
// //    * وظيفة الدالة فقط: التحقق من الملف رفعه، وإعادة الرابط الكامل
// //    */
// //   async uploadFile(file: Express.Multer.File): Promise<string> {
// //     // 1. فحص الأمان (Validation): الحجم والنوع
// //     // فيكِ تعدلي القائمة حسب شو مسموح للطلاب يرفعوا
// //     const allowedMimeTypes = [
// //       'image/jpeg', 
// //       'image/png', 
// //       'application/pdf', 
// //       'application/zip', 
// //       'application/x-zip-compressed'
// //     ];

// //     if (!allowedMimeTypes.includes(file.mimetype)) {
// //       throw new BadRequestException('نوع الملف غير مسموح به (فقط صور، PDF، أو ملفات مضغوطة)');
// //     }

// //     // حددنا الحجم بـ 5 ميجا مثلاً
// //     const maxSize = 5 * 1024 * 1024; 
// //     if (file.size > maxSize) {
// //       throw new BadRequestException('حجم الملف كبير جداً (الحد الأقصى 5MB)');
// //     }

// //     const fileName = `${Date.now()}-${file.originalname}`;

// //     try {
// //       // 2. الرفع الفعلي لـ S3 (MinIO أو Supabase)
// //       await this.s3Client.send(
// //         new PutObjectCommand({
// //           Bucket: this.bucketName,
// //           Key: fileName,
// //           Body: file.buffer,
// //           ContentType: file.mimetype,
// //         }),
// //       );

// //       // 3. بناء الرابط الديناميكي بناءً على الـ Provider الحالي
// //       const publicUrl = this.configService.get<string>('storage.public_url');
      
// //       // منرجع الرابط النهائي لـ AssignmentService
// //       return `${publicUrl}/${this.bucketName}/${fileName}`;

// //     } catch (error) {
// //       console.error('S3 Upload Error:', error);
// //       // هون منرمي خطأ مشان الـ Transaction اللي بالـ Service الأساسي يعمل Rollback
// //       throw new InternalServerErrorException('فشل رفع الملف للسيرفر السحابي');
// //     }
// //   }
// // }

// // @Injectable()
// // export class StorageService {
// //   private readonly logger = new AppLoggerService(); // أو عبر الـ Dependency Injection
  
// //   async uploadFile(file: Express.Multer.File): Promise<string> {
// //     this.logger.log(`Attempting to upload file: ${file.originalname}`, 'StorageService');

// //     try {
// //       // كود الرفع...
// //       this.logger.log(`File uploaded successfully: ${fileName}`, 'StorageService');
// //       return url;
// //     } catch (error) {
// //       this.logger.error(`Upload failed for ${file.originalname}`, error.stack, 'StorageService', {
// //         bucket: this.bucketName,
// //         size: file.size
// //       });
// //       throw error;
// //     }
// //   }
// // }
// // async create(courseId: number, dto: CreateAssignmentDto, instructorId: string, file?: Express.Multer.File) {
// //   // 1. استخدام QueryRunner لبدء Transaction
// //   const queryRunner = this.dataSource.createQueryRunner();
// //   await queryRunner.connect();
// //   await queryRunner.startTransaction();

// //   let uploadedFileKey: string | undefined;

// //   try {
// //     // 2. التحقق من الكورس (ضمن الـ Transaction لضمان ثبات البيانات)
// //     const course = await queryRunner.manager.findOne(Course, { 
// //       where: { id: courseId }, relations: ['instructor'] 
// //     });
    
// //     if (!course) throw new NotFoundException('Course not found');
// //     if (course.instructor.id !== instructorId) throw new ForbiddenException('Not your course');

// //     let fileUrl: string | undefined;
// //     if (dto.submissionType === SubmissionType.FILE) {
// //       if (!file) throw new BadRequestException('File is required');

// //       // 3. الرفع للسحاب
// //       const uploadResult = await this.storageService.uploadFile(file);
// //       fileUrl = uploadResult;
      
// //       // نحفظ اسم الملف مشان إذا فشلت الداتابيز نمسحه
// //       uploadedFileKey = fileUrl.split('/').pop(); 
// //     }

// //     // 4. حفظ الوظيفة
// //     const assignment = queryRunner.manager.create(Assignment, {
// //       ...dto,
// //       fileUrl,
// //       course,
// //     });
// //     const savedAssignment = await queryRunner.manager.save(assignment);

// //     // 5. إذا وصلنا لهون منثبت كل شي
// //     await queryRunner.commitTransaction();

// //     // 6. نرسل الـ Event بعد الـ Commit (عشان نضمن إن الداتا انحفظت فعلياً)
// //     this.eventEmitter.emit('assignment.created', { ... });

// //     return savedAssignment;

// //   } catch (err) {
// //     // 7. إذا صار أي خطأ بالداتابيز، منعمل Rollback
// //     await queryRunner.rollbackTransaction();

// //     // 8. (الضربة القاضية) إذا كان الملف انرفع، منمسحه من السحاب فوراً
// //     if (uploadedFileKey) {
// //       await this.storageService.deleteFile(uploadedFileKey).catch(e => console.error("Cleanup failed", e));
// //     }

// //     throw err;
// //   } finally {
// //     await queryRunner.release();
// //   }
// // }






// import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
// import { ConfigService } from '@nestjs/config';
// import { AppLoggerService } from '../logger/logger.service';

// @Injectable()
// export class StorageService {
//   private readonly s3Client: S3Client;
//   private readonly bucketName: string;

//   constructor(
//     private readonly configService: ConfigService,
//     private readonly logger: AppLoggerService,
//   ) {
//     // جلب الإعدادات من ملف الـ .env
//     this.bucketName = this.configService.get<string>('storage.bucket')!;
    
//     this.s3Client = new S3Client({
//       endpoint: this.configService.get<string>('storage.endpoint')!,
//       region: 'auto',
//       credentials: {
//         accessKeyId: this.configService.get<string>('storage.api_key')!,
//         secretAccessKey: this.configService.get<string>('storage.api_secret')!,
//       },
//       forcePathStyle: true, // ضرورية للعمل مع MinIO و Supabase
//     });
//   }

//   async uploadFile(file: Express.Multer.File): Promise<string> {
//     this.logger.log(`Attempting to upload file: ${file.originalname}`, 'StorageService');

//     // 1. التحقق من نوع الملف (Security Validation)
//     const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
//     if (!allowedMimeTypes.includes(file.mimetype)) {
//       this.logger.warn(`Upload rejected: Invalid file type ${file.mimetype}`, 'StorageService');
//       throw new BadRequestException('File type not allowed');
//     }

//     // 2. التحقق من الحجم (الحد الأقصى 5MB)
//     const maxSize = 5 * 1024 * 1024;
//     if (file.size > maxSize) {
//       this.logger.warn(`Upload rejected: File size ${file.size} exceeds limit`, 'StorageService');
//       throw new BadRequestException('File size exceeds the 5MB limit');
//     }

//     const fileName = `${Date.now()}-${file.originalname}`;

//     try {
//       // 3. تنفيذ عملية الرفع إلى S3
//       await this.s3Client.send(
//         new PutObjectCommand({
//           Bucket: this.bucketName,
//           Key: fileName,
//           Body: file.buffer,
//           ContentType: file.mimetype,
//         }),
//       );

//       // 4. بناء رابط الوصول العمومي (Public URL)
//       const publicUrl = this.configService.get<string>('storage.public_url');
//       const fileFullUrl = `${publicUrl}/${this.bucketName}/${fileName}`;

//       this.logger.log(`File uploaded successfully: ${fileName}`, 'StorageService');
      
//       return fileFullUrl;
//     } catch (error) {
//       this.logger.error(
//         `Upload failed for ${file.originalname}`,
//         error.stack,
//         'StorageService',
//         { bucket: this.bucketName, size: file.size }
//       );
//       throw new InternalServerErrorException('Error occurred during file upload');
//     }
//   }

//   async deleteFile(fileKey: string): Promise<void> {
//     this.logger.log(`Attempting to delete file: ${fileKey}`, 'StorageService');

//     try {
//       await this.s3Client.send(
//         new DeleteObjectCommand({
//           Bucket: this.bucketName,
//           Key: fileKey,
//         }),
//       );
//       this.logger.log(`File ${fileKey} deleted successfully from S3`, 'StorageService');
//     } catch (error) {
//       this.logger.error(
//         `Failed to delete file: ${fileKey}`,
//         error.stack,
//         'StorageService'
//       );
//       // ملاحظة: غالباً لا نلقي خطأ هنا لكي لا نعطل عملية الـ Rollback الأساسية
//     }
//   }
// }