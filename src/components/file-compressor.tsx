"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Download,
  File,
  FileText,
  FileArchive,
  UploadCloud,
  X,
} from "lucide-react";
import { useActionState, useTransition } from "react";
import { compressImage, compressDocs, type ConversionState } from "@/app/actions";
import { motion } from "framer-motion";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_FILES = 20;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export default function FileCompressor() {
  const [files, setFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState<"image" | "doc" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, formAction] = useActionState(
    fileType === "image" ? compressImage : compressDocs,
    { message: null, results: [], error: null }
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadLinksRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (formState.message) {
      if (formState.error) {
        toast({
          variant: "destructive",
          title: "Compression Failed",
          description: formState.message,
        });
      } else {
        toast({
          title: "Success!",
          description: formState.message,
        });
      }
    }
  }, [formState, toast]);

  const handleFiles = (fileList: FileList | File[]) => {
    const arr = Array.from(fileList).slice(0, MAX_FILES);
    let totalSize = 0;
    let type: "image" | "doc" | null = null;
    for (const file of arr) {
      if (IMAGE_TYPES.includes(file.type)) type = "image";
      else if (DOC_TYPES.includes(file.type)) type = "doc";
      else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Unsupported file type.",
        });
        return;
      }
      totalSize += file.size;
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      toast({
        variant: "destructive",
        title: "File Size Limit",
        description: "Max total size is 50MB.",
      });
      return;
    }
    setFiles(arr);
    setFileType(type);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const handleReset = () => {
    setFiles([]);
    setFileType(null);
    formState.results = [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !fileType) return;
    const formData = new FormData();
    if (fileType === "image") {
      files.forEach((file) => formData.append("images", file));
    } else if (fileType === "doc") {
      files.forEach((file) => formData.append("docs", file));
    }
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/10 mt-12 rounded-lg border bg-card text-card-foreground">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileArchive className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold tracking-tight">File Compressor</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Compress up to 20 images or documents (max 50MB per request) with best quality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {files.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer transition-colors bg-card hover:border-primary/60 hover:bg-accent/10 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <UploadCloud className="mx-auto h-14 w-14 text-primary/70 group-hover:scale-110 transition-transform duration-200" />
                  <p className="mt-4 font-semibold text-foreground text-lg">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">Images: PNG, JPG, WEBP | Docs: PDF, DOCX, TXT (max 50MB, up to 20 files)</p>
                </div>
                <Input
                  ref={fileInputRef}
                  id="files"
                  name="files"
                  type="file"
                  className="hidden"
                  onChange={handleChange}
                  accept={[...IMAGE_TYPES, ...DOC_TYPES].join(",")}
                  multiple
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap gap-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 border rounded-lg px-3 py-1 bg-muted/60 shadow-sm"
                    >
                      {IMAGE_TYPES.includes(file.type) ? (
                        <File className="h-4 w-4 text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary" />
                      )}
                      <span className="text-xs font-medium text-foreground/90">{file.name}</span>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Label>Detected Type:</Label>
                  <span className="font-semibold text-primary">
                    {fileType === "image"
                      ? "Image(s)"
                      : fileType === "doc"
                        ? "Document(s)"
                        : "-"}
                  </span>
                </div>
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <FeatureBox
                title="How to Compress Images"
                description="Upload up to 20 images (PNG, JPG, WEBP). We'll compress them to the best quality."
                active={fileType === "image"}
              />
              <FeatureBox
                title="How to Compress Documents"
                description="Upload up to 20 docs (PDF, DOCX, TXT). We'll zip them for you."
                active={fileType === "doc"}
              />
            </div>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center mt-6"
              >
                <Button type="submit" size="lg" disabled={isPending} className="px-8 py-4 text-lg font-semibold shadow-lg rounded-lg">
                  {isPending ? "Compressing..." : "Compress Files"}
                </Button>
              </motion.div>
            )}
          </form>
          {isPending && (
            <Progress value={undefined} className="animate-pulse mt-6" />
          )}
          {formState.results && formState.results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              <Label className="text-center block mb-2 text-lg font-semibold">Compressed Files</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {formState.results.map((result, idx) =>
                  result.convertedImage ? (
                    <div
                      key={idx}
                      className="border rounded-lg p-6 flex flex-col items-center bg-muted/40 shadow-md"
                    >
                      <p className="text-green-600 text-sm mb-2">{result.message}</p>
                      <a
                        ref={el => { downloadLinksRef.current[idx] = el || null; }}
                        href={result.convertedImage}
                        download={typeof result.fileName === "string" ? result.fileName : `compressed-file-${idx + 1}`}
                        className="hidden"
                      >
                        Download
                      </a>
                      <Button
                        className="mt-2 rounded-lg"
                        size="sm"
                        onClick={() => downloadLinksRef.current[idx]?.click()}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download {result.fileName}
                      </Button>
                    </div>
                  ) : (
                    <div
                      key={idx}
                      className="border rounded-lg p-6 flex flex-col items-center bg-muted/40 shadow-md"
                    >
                      <p className="text-red-600 text-sm mb-2">{result.message || "Compression failed."}</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeatureBox({
  title,
  description,
  active,
}: {
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`rounded-lg border p-6 shadow-md transition-shadow flex flex-col gap-2 ${active ? "border-primary shadow-lg bg-primary/5" : "bg-muted/30"}`}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-base">{description}</p>
    </motion.div>
  );
}
