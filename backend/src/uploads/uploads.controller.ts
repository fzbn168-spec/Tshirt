import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // In production, we need a better way to get the base URL.
    // For now, we return a relative path or assume the frontend knows the base.
    // But the frontend expects a full URL usually.
    // Let's return the full URL assuming standard port or proxy.

    // If behind Nginx proxy (which handles /uploads), the URL is just /uploads/filename
    // The frontend can prepend the domain if needed, or use it as relative.
    // However, FileUpload.tsx expects `data.url`.

    // If we return absolute URL:
    // We can use the HOST header or an ENV var.
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return {
      url: `${baseUrl}/uploads/${file.filename}`,
    };
  }
}
