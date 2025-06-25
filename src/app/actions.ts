"use server";

import sharp from "sharp";
import { z } from "zod";
import archiver from "archiver";
import stream from "stream";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_FILES = 20;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

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

function validateFiles(
  files: any[],
  acceptedTypes: string[],
  maxFiles: number,
  maxTotalSize: number
) {
  if (files.length === 0) return { error: true, message: "No files uploaded." };
  if (files.length > maxFiles)
    return { error: true, message: `Max ${maxFiles} files allowed.` };
  let totalSize = 0;
  for (const file of files) {
    if (!acceptedTypes.includes(file.type)) {
      return { error: true, message: `File type ${file.type} not accepted.` };
    }
    totalSize += file.size;
  }
  if (totalSize > maxTotalSize)
    return {
      error: true,
      message: `Max total size is ${maxTotalSize / (1024 * 1024)}MB.`,
    };
  return { error: false };
}

export async function convertImage(
  prevState: ConversionState,
  formData: FormData
): Promise<ConversionState> {
  // Get all files and conversion types
  const images = formData.getAll("images");
  const conversionTypes = formData.getAll("conversionTypes");

  if (
    !images.length ||
    !conversionTypes.length ||
    images.length !== conversionTypes.length
  ) {
    return {
      error: true,
      message: "Please upload up to 10 images and select conversion types.",
    };
  }

  const results: ConversionResult[] = await Promise.all(
    images.map(async (image: any, idx: number) => {
      // Validate file
      if (!image || image.size === 0) {
        return { message: "Image is required.", error: true };
      }
      if (image.size > MAX_FILE_SIZE) {
        return { message: "Max file size is 10MB.", error: true };
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(image.type)) {
        return {
          message: ".jpg, .jpeg, .png and .webp files are accepted.",
          error: true,
        };
      }
      const conversionType = conversionTypes[idx];
      try {
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        let convertedBuffer;
        let outputFileName;
        let mimeType;
        if (conversionType === "to-webp") {
          if (image.type === "image/webp") {
            return { message: "Image is already in WebP format.", error: true };
          }
          convertedBuffer = await sharp(imageBuffer)
            .webp({ quality: 80 })
            .toBuffer();
          outputFileName = `${image.name
            .split(".")
            .slice(0, -1)
            .join(".")}.webp`;
          mimeType = "image/webp";
        } else {
          // to-png
          if (image.type !== "image/webp") {
            return {
              message: "Only WebP files can be converted to PNG.",
              error: true,
            };
          }
          convertedBuffer = await sharp(imageBuffer).png().toBuffer();
          outputFileName = `${image.name
            .split(".")
            .slice(0, -1)
            .join(".")}.png`;
          mimeType = "image/png";
        }
        const base64Image = `data:${mimeType};base64,${convertedBuffer.toString(
          "base64"
        )}`;
        return {
          message: "Conversion successful!",
          convertedImage: base64Image,
          fileName: outputFileName,
          error: false,
        };
      } catch (error) {
        console.error(error);
        return {
          message: "An unexpected error occurred during conversion.",
          error: true,
        };
      }
    })
  );

  return {
    results,
    error: results.some((r) => r.error),
    message: results.some((r) => r.error)
      ? "Some conversions failed."
      : "All conversions successful!",
  };
}

export async function compressImage(
  prevState: ConversionState,
  formData: FormData
): Promise<ConversionState> {
  const images = formData.getAll("images");
  const validation = validateFiles(
    images,
    ACCEPTED_IMAGE_TYPES,
    MAX_FILES,
    MAX_TOTAL_SIZE
  );
  if (validation.error) return { error: true, message: validation.message };
  const results: ConversionResult[] = await Promise.all(
    images.map(async (image: any, idx: number) => {
      try {
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        // Use sharp to compress (quality 80, lossless for PNG)
        let compressedBuffer;
        let outputFileName;
        let mimeType = image.type;
        if (image.type === "image/jpeg" || image.type === "image/jpg") {
          compressedBuffer = await sharp(imageBuffer)
            .jpeg({ quality: 80 })
            .toBuffer();
          outputFileName = `${image.name
            .split(".")
            .slice(0, -1)
            .join(".")}-compressed.jpg`;
        } else if (image.type === "image/png") {
          compressedBuffer = await sharp(imageBuffer)
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer();
          outputFileName = `${image.name
            .split(".")
            .slice(0, -1)
            .join(".")}-compressed.png`;
        } else if (image.type === "image/webp") {
          compressedBuffer = await sharp(imageBuffer)
            .webp({ quality: 80 })
            .toBuffer();
          outputFileName = `${image.name
            .split(".")
            .slice(0, -1)
            .join(".")}-compressed.webp`;
        } else {
          return { message: "Unsupported image type.", error: true };
        }
        const base64Image = `data:${mimeType};base64,${compressedBuffer.toString(
          "base64"
        )}`;
        return {
          message: "Compression successful!",
          convertedImage: base64Image,
          fileName: outputFileName,
          error: false,
        };
      } catch (error) {
        return { message: "Compression failed.", error: true };
      }
    })
  );
  return {
    results,
    error: results.some((r) => r.error),
    message: results.some((r) => r.error)
      ? "Some compressions failed."
      : "All compressions successful!",
  };
}

export async function compressDocs(
  prevState: ConversionState,
  formData: FormData
): Promise<ConversionState> {
  const docs = formData.getAll("docs");
  const validation = validateFiles(
    docs,
    ACCEPTED_DOC_TYPES,
    MAX_FILES,
    MAX_TOTAL_SIZE
  );
  if (validation.error) return { error: true, message: validation.message };
  try {
    // Create a zip archive in memory
    const archiveStream = new stream.PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(archiveStream);
    for (const doc of docs) {
      const buffer = Buffer.from(await doc.arrayBuffer());
      archive.append(buffer, { name: doc.name });
    }
    await archive.finalize();
    const chunks: Buffer[] = [];
    for await (const chunk of archiveStream) {
      chunks.push(chunk);
    }
    const zipBuffer = Buffer.concat(chunks);
    const base64Zip = `data:application/zip;base64,${zipBuffer.toString(
      "base64"
    )}`;
    return {
      results: [
        {
          message: "Compression successful!",
          convertedImage: base64Zip,
          fileName: "compressed-docs.zip",
          error: false,
        },
      ],
      error: false,
      message: "All compressions successful!",
    };
  } catch (error) {
    return { error: true, message: "Compression failed." };
  }
}
