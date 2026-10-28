import { NOTO_SANS_NORMAL } from './notoSansnormal';
import { NOTO_SANS_BOLD } from './notoSansbold';
import { NOTO_SANS_ITALIC } from './notoSansitalic';
import { NOTO_SANS_BOLDITALIC } from './notoSansbolditalic';

export const NOTO_FONT_FILES: Record<string, { file: string; base64: string }> = {
  normal: { file: 'NotoSans-Regular.ttf', base64: NOTO_SANS_NORMAL },
  bold: { file: 'NotoSans-Bold.ttf', base64: NOTO_SANS_BOLD },
  italic: { file: 'NotoSans-Italic.ttf', base64: NOTO_SANS_ITALIC },
  bolditalic: { file: 'NotoSans-BoldItalic.ttf', base64: NOTO_SANS_BOLDITALIC },
};
