import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../firebase/storage.service';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 3;

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_MIMES.join(', ')}`,
      );
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File too large. Max 5 MB');
    }

    const count = await this.prisma.userPhoto.count({ where: { userId } });
    if (count >= MAX_PHOTOS) {
      throw new BadRequestException(`Max ${MAX_PHOTOS} photos allowed`);
    }

    const webpBuffer = await sharp(file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const metadata = await sharp(webpBuffer).metadata();

    const photoId = randomUUID();
    const storageKey = `users/${userId}/photos/${photoId}.webp`;
    const url = await this.storage.upload(webpBuffer, storageKey, 'image/webp');

    const position = count; // next available position

    const photo = await this.prisma.userPhoto.create({
      data: {
        userId,
        url,
        storageKey,
        originalFormat: file.mimetype.replace('image/', ''),
        format: 'webp',
        position,
        sizeBytes: webpBuffer.length,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      },
    });

    if (position === 0) {
      await this.syncAvatar(userId, url);
    }

    return photo;
  }

  async listByUser(userId: string) {
    return this.prisma.userPhoto.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });
  }

  async remove(userId: string, position: number) {
    const photo = await this.prisma.userPhoto.findUnique({
      where: { userId_position: { userId, position } },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    if (photo.storageKey) {
      await this.storage.delete(photo.storageKey);
    }

    await this.prisma.userPhoto.delete({ where: { id: photo.id } });

    // Reindex remaining photos to close the gap
    const remaining = await this.prisma.userPhoto.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await this.prisma.userPhoto.update({
          where: { id: remaining[i].id },
          data: { position: i },
        });
      }
    }

    // Sync avatar with new position 0 photo (or clear it)
    const newFirst = await this.prisma.userPhoto.findUnique({
      where: { userId_position: { userId, position: 0 } },
    });
    await this.syncAvatar(userId, newFirst?.url ?? null);

    return { message: 'Photo deleted' };
  }

  async reorder(userId: string, currentPosition: number, newPosition: number) {
    const photo = await this.prisma.userPhoto.findUnique({
      where: { userId_position: { userId, position: currentPosition } },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    const maxPos = (await this.prisma.userPhoto.count({ where: { userId } })) - 1;
    if (newPosition > maxPos) {
      throw new BadRequestException(
        `newPosition must be between 0 and ${maxPos}`,
      );
    }
    if (currentPosition === newPosition) return this.listByUser(userId);

    // Get all photos for this user, ordered by position
    const photos = await this.prisma.userPhoto.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });

    // Move to temporary negative positions to avoid unique constraint violation
    await this.prisma.$transaction(
      photos.map((p, i) =>
        this.prisma.userPhoto.update({
          where: { id: p.id },
          data: { position: -(i + 1) },
        }),
      ),
    );

    // Compute new order
    const reordered = [...photos];
    const [moved] = reordered.splice(currentPosition, 1);
    reordered.splice(newPosition, 0, moved);

    // Apply final positions
    await this.prisma.$transaction(
      reordered.map((p, i) =>
        this.prisma.userPhoto.update({
          where: { id: p.id },
          data: { position: i },
        }),
      ),
    );

    // Sync avatar with new position-0 photo
    await this.syncAvatar(userId, reordered[0].url);

    return this.listByUser(userId);
  }

  private async syncAvatar(userId: string, url: string | null) {
    await this.prisma.userProfile.upsert({
      where: { userId },
      update: { avatarUrl: url },
      create: { userId, avatarUrl: url },
    });
  }
}
