import { Module } from '@nestjs/common';
import { InterestsController } from './interests.controller';
import { InterestsService } from './interests.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [InterestsController],
  providers: [InterestsService],
})
export class InterestsModule {}
