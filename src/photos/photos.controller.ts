import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PhotosService } from './photos.service';
import { ReorderPhotoDto } from './dto/reorder-photo.dto';

@Controller('users/me/photos')
@UseGuards(JwtGuard)
export class PhotosController {
  constructor(private readonly service: PhotosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  upload(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.service.upload(req.user.sub, file);
  }

  @Get()
  list(@Req() req: any) {
    return this.service.listByUser(req.user.sub);
  }

  @Delete(':position')
  remove(@Req() req: any, @Param('position', ParseIntPipe) position: number) {
    return this.service.remove(req.user.sub, position);
  }

  @Patch(':position/reorder')
  reorder(
    @Req() req: any,
    @Param('position', ParseIntPipe) position: number,
    @Body() dto: ReorderPhotoDto,
  ) {
    return this.service.reorder(req.user.sub, position, dto.newPosition);
  }
}
