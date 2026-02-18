import { Injectable, Logger } from '@nestjs/common';
import { translate } from 'google-translate-api-x';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  async translateText(text: string, to: string): Promise<string> {
    if (!text) return '';
    try {
      const res = await translate(text, { to });
      return res.text;
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`);
      return text; // Fallback to original text
    }
  }

  // Automatically fill missing keys in a localized object
  async autoFill(localizedObj: {
    en?: string;
    zh?: string;
  }): Promise<{ en: string; zh: string }> {
    const res = { en: localizedObj.en || '', zh: localizedObj.zh || '' };

    if (res.en && !res.zh) {
      res.zh = await this.translateText(res.en, 'zh-CN');
    } else if (res.zh && !res.en) {
      res.en = await this.translateText(res.zh, 'en');
    }

    return res;
  }
}
