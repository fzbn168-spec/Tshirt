import { Module } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { PrismaService } from '../prisma.service';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [TranslationModule],
  controllers: [AttributesController],
  providers: [AttributesService, PrismaService],
  exports: [AttributesService],
})
export class AttributesModule {}
