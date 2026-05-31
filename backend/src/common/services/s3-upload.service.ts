import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { extname } from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class S3UploadService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.client = new S3Client({
      region: this.region,
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      } : undefined, // falls back to IAM role if no explicit creds
    });
  }

  async upload(
    file: Express.Multer.File,
    folder: 'logos' | 'staff-photos' | 'student-photos',
  ): Promise<string> {
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    const key = `uploads/${folder}/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;

    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000',
      }));
    } catch (err: any) {
      throw new InternalServerErrorException(`S3 upload failed: ${err.message}`);
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /** Delete old file if it was previously stored on S3 */
  async deleteIfS3(url?: string | null): Promise<void> {
    if (!url || !url.includes('.amazonaws.com/')) return;
    try {
      const key = url.split('.amazonaws.com/')[1];
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      // best-effort cleanup — don't fail the main operation
    }
  }
}
