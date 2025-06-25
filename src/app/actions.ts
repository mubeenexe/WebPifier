
'use server';

import sharp from 'sharp';
import { z } from 'zod';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formSchema = z.object({
  image: z
    .any()
    .refine((file) => file?.size > 0, 'Image is required.')
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  conversionType: z.enum(['to-webp', 'to-png']),
});

export type ConversionState = {
  message?: string | null;
  convertedImage?: string | null;
  fileName?: string | null;
  error?: boolean | null;
}

export async function convertImage(prevState: ConversionState, formData: FormData): Promise<ConversionState> {
  const validatedFields = formSchema.safeParse({
    image: formData.get('image'),
    conversionType: formData.get('conversionType'),
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.flatten().fieldErrors.image?.[0];
    return {
      message: firstError || 'Invalid input.',
      error: true,
    };
  }

  const { image, conversionType } = validatedFields.data;

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
}
