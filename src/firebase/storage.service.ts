import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Injectable()
export class StorageService {
  constructor(private firebase: FirebaseService) {}

  async upload(
    buffer: Buffer,
    storageKey: string,
    contentType: string,
  ): Promise<string> {
    const bucket = this.firebase.getBucket();
    const file = bucket.file(storageKey);

    await file.save(buffer, {
      metadata: { contentType },
      public: true,
    });

    return this.getPublicUrl(storageKey);
  }

  getPublicUrl(storageKey: string): string {
    const bucketName = this.firebase.getBucket().name;
    return `https://storage.googleapis.com/${bucketName}/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    const bucket = this.firebase.getBucket();
    const file = bucket.file(storageKey);
    await file.delete({ ignoreNotFound: true });
  }
}
