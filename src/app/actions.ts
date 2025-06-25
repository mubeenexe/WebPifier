'use server';

import sharp from 'sharp';
import { z } from 'zod';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  images: z.any(), // Will validate manually below
  conversionTypes: z.any(),
});

export type ConversionResult = {
  message?: string | null;
  convertedImage?: string | null;
  fileName?: string | null;
  error?: boolean | null;
};

export type ConversionState = {
  results?: ConversionResult[];
  error?: boolean | null;
  message?: string | null;
};

export async function convertImage(prevState: ConversionState, formData: FormData): Promise<ConversionState> {
  // Get all files and conversion types
  const images = formData.getAll('images');
  const conversionTypes = formData.getAll('conversionTypes');

  if (!images.length || !conversionTypes.length || images.length !== conversionTypes.length) {
    return { error: true, message: 'Please upload up to 10 images and select conversion types.' };
  }

  const results: ConversionResult[] = await Promise.all(images.map(async (image: any, idx: number) => {
    // Validate file
    if (!image || image.size === 0) {
      return { message: 'Image is required.', error: true };
    }
    if (image.size > MAX_FILE_SIZE) {
      return { message: 'Max file size is 10MB.', error: true };
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
      return { message: '.jpg, .jpeg, .png and .webp files are accepted.', error: true };
    }
    const conversionType = conversionTypes[idx];
    try {
      const imageBuffer = Buffer.from(await image.arrayBuffer());
      let convertedBuffer;
      let outputFileName;
      let mimeType;
      if (conversionType === 'to-webp') {
        if (image.type === 'image/webp') {
          return { message: 'Image is already in WebP format.', error: true };
        }
        convertedBuffer = await sharp(imageBuffer).webp({ quality: 80 }).toBuffer();
        outputFileName = `${image.name.split('.').slice(0, -1).join('.')}.webp`;
        mimeType = 'image/webp';
      } else { // to-png
        if (image.type !== 'image/webp') {
          return { message: 'Only WebP files can be converted to PNG.', error: true };
        }
        convertedBuffer = await sharp(imageBuffer).png().toBuffer();
        outputFileName = `${image.name.split('.').slice(0, -1).join('.')}.png`;
        mimeType = 'image/png';
      }
      const base64Image = `data:${mimeType};base64,${convertedBuffer.toString('base64')}`;
      return {
        message: 'Conversion successful!',
        convertedImage: base64Image,
        fileName: outputFileName,
        error: false,
      };
    } catch (error) {
      console.error(error);
      return { message: 'An unexpected error occurred during conversion.', error: true };
    }
  }));

  return {
    results,
    error: results.some(r => r.error),
    message: results.some(r => r.error) ? 'Some conversions failed.' : 'All conversions successful!',
  };
}
