import { Injectable, BadRequestException, InternalServerErrorException, LoggerService } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
    private readonly bucketName:string | undefined
    private logger: AppLoggerService
  constructor(
    private configService: ConfigService,
    logger: AppLoggerService
    
  ) {
    this.bucketName= this.configService.get<string>('storage.bucket')
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('storage.endpoint')!,
      region: 'auto',
      credentials: {
        accessKeyId: this.configService.get<string>('storage.api_key')!,
        secretAccessKey: this.configService.get<string>('storage.api_secret')!,
      },
      forcePathStyle: true,
    });
    this.logger = logger
  }
  async uploadFile(file: Express.Multer.File): Promise<string> {
        this.logger.log(`Attempting to upload file: ${file.originalname}`, 'StorageService');
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }
    const maxsize = 5* 1024 * 1024
    if(file.size> maxsize){
        throw new BadRequestException("File size not allowed")
    }
    const fileName = `${Date.now()}-${file.originalname}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
  }),
      );


      const publicUrl = this.configService.get<string>('storage.public_url');
      const fileFullUrl = `${publicUrl}/${this.bucketName}/${fileName}`;
        this.logger.log(`File uploaded successfully: ${fileName}`, 'StorageService');
      return fileFullUrl;
    } catch (error) {
      
      this.logger.error(`Upload failed for ${file.originalname}`, error.stack, 'StorageService', {
        bucket: this.bucketName,
        size: file.size
      });
      throw new InternalServerErrorException('Upload failed');
     }
  }

  async deleteFile(fileKey: string) {
     this.logger.log(`Attempting to delete file: ${fileKey}`, 'StorageService');

  try {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );
    this.logger.log(`File ${fileKey} deleted successfully from S3`, 'StorageService');
     } catch (error) {
      this.logger.error(
        `Failed to delete file: ${fileKey}`,
        error.stack,
        'StorageService')}}
}