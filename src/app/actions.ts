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
  const targetSizeMB = parseInt(formData.get("targetSize") as string) || 20;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
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
        let compressedBuffer;
        let outputFileName;
        let mimeType = image.type;
        let quality = 80;
        // Binary search for quality to approach target size (JPEG/WEBP)
        if (
          image.type === "image/jpeg" ||
          image.type === "image/jpg" ||
          image.type === "image/webp"
        ) {
          let minQ = 10,
            maxQ = 100,
            bestQ = 80,
            bestBuf = null,
            bestDiff = Infinity;
          for (let i = 0; i < 7; i++) {
            // 7 iterations is enough for 1-100
            quality = Math.round((minQ + maxQ) / 2);
            let buf;
            if (image.type === "image/jpeg" || image.type === "image/jpg") {
              buf = await sharp(imageBuffer).jpeg({ quality }).toBuffer();
            } else {
              buf = await sharp(imageBuffer).webp({ quality }).toBuffer();
            }
            const diff = Math.abs(buf.length - targetSizeBytes);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestQ = quality;
              bestBuf = buf;
            }
            if (buf.length > targetSizeBytes) {
              maxQ = quality - 1;
            } else {
              minQ = quality + 1;
            }
          }
          compressedBuffer = bestBuf;
          quality = bestQ;
          outputFileName = `${image.name
            .split(".")
            .slice(0, -1)
            .join(".")}-compressed.${
            image.type === "image/webp" ? "webp" : "jpg"
          }`;
        } else if (image.type === "image/png") {
          // PNG: try different compression levels, but PNG is lossless so size control is limited
          let bestBuf = await sharp(imageBuffer)
            .png({ quality: 80, compressionLevel: 9 })
            .toBuffer();
          compressedBuffer = bestBuf;
          outputFileName = `${image.name
            .split(".")
            .slice(0, -1)
            .join(".")}-compressed.png`;
        } else {
          return { message: "Unsupported image type.", error: true };
        }
        // After binary search for quality
        if (!compressedBuffer) {
          return {
            message: "Compression failed: could not generate output.",
            error: true,
          };
        }
        const base64Image = `data:${mimeType};base64,${compressedBuffer.toString(
          "base64"
        )}`;
        return {
          message: `Compression successful! Output size: ${(
            compressedBuffer.length /
            (1024 * 1024)
          ).toFixed(2)} MB (Quality: ${quality})`,
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
      if (
        typeof doc === "object" &&
        doc !== null &&
        "arrayBuffer" in doc &&
        "name" in doc
      ) {
        const buffer = Buffer.from(await doc.arrayBuffer());
        archive.append(buffer, { name: doc.name });
      } else {
        // Skip or handle non-File entries
        continue;
      }
    }
    let totalLength = 0;
    archiveStream.on("data", (chunk) => {
      totalLength += chunk.length;
    });
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
