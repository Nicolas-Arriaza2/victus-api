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
    try {
      const credJson = this.config.get<string>('FIREBASE_CREDENTIALS_JSON');
      let serviceAccount: any;

      if (credJson) {
        serviceAccount = JSON.parse(credJson);
        this.logger.log('Firebase credentials loaded from env var');
      } else {
        const credPath = this.config.get<string>('FIREBASE_CREDENTIALS_PATH');
        if (!credPath) {
          this.logger.warn(
            'No Firebase credentials configured (FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH). Firebase disabled.',
          );
          return;
        }
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
    } catch (err) {
      this.logger.error('Failed to initialize Firebase', err.message);
    }
  }

  getApp() {
    return this.app;
  }

  getBucket() {
    return this.bucket;
  }
}
