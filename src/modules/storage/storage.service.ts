import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Storage } from 'firebase-admin/storage';
import { FIREBASE_STORAGE } from '../../firebase';

interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StorageService {
  private readonly allowedMimeTypes = new Set(['image/png', 'image/jpeg']);

  constructor(
    @Inject(FIREBASE_STORAGE)
    private readonly firebaseStorage: Storage,
  ) {}

  async uploadImage(file: UploadedImageFile) {
    if (!file || !file.buffer || file.size <= 0) {
      throw new BadRequestException('Archivo inválido');
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes PNG o JPG');
    }

    const extensionFromName = extname(file.originalname).toLowerCase();
    const extension =
      extensionFromName && extensionFromName !== ''
        ? extensionFromName
        : file.mimetype === 'image/png'
          ? '.png'
          : '.jpg';

    const objectPath = `templates/${Date.now()}-${randomUUID()}${extension}`;
    const bucket = this.firebaseStorage.bucket();
    const bucketFile = bucket.file(objectPath);

    await bucketFile.save(file.buffer, {
      resumable: false,
      contentType: file.mimetype,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    const [url] = await bucketFile.getSignedUrl({
      action: 'read',
      expires: '01-01-2500',
    });

    return {
      url,
      path: objectPath,
      contentType: file.mimetype,
      size: file.size,
    };
  }
}
