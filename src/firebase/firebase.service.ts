import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { resolve } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;
  private bucket: ReturnType<admin.storage.Storage['bucket']>;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const credJson = this.config.get<string>('FIREBASE_CREDENTIALS_JSON');
    let serviceAccount: any;

    if (credJson) {
      serviceAccount = JSON.parse(credJson);
      this.logger.log('Firebase credentials loaded from env var');
    } else {
      const credPath = this.config.getOrThrow<string>(
        'FIREBASE_CREDENTIALS_PATH',
      );
      const absolutePath = resolve(process.cwd(), credPath);
      serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf-8'));
      this.logger.log('Firebase credentials loaded from file');
    }

    const bucketUrl = this.config
      .getOrThrow<string>('FIREBASE_STORAGE_BUCKET')
      .replace(/^gs:\/\//, '');

    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucketUrl,
    });

    this.bucket = this.app.storage().bucket();
    this.logger.log(`Firebase initialized — bucket: ${bucketUrl}`);
  }

  getApp() {
    return this.app;
  }

  getBucket() {
    return this.bucket;
  }
}
