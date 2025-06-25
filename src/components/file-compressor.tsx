"use client";

import { useState, useRef } from "react";
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
  const [isPending, setIsPending] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setResults([]);
  };

  // Placeholder for submit logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    // TODO: Call compressImage or compressDocs server action
    setTimeout(() => {
      setIsPending(false);
      setResults([
        {
          message: "Compression successful! (placeholder)",
          fileName: files[0]?.name,
        },
      ]);
    }, 1200);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/10 mt-12">
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileArchive className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold tracking-tight">
            File Compressor
          </CardTitle>
        </div>
        <CardDescription className="text-lg">
          Compress up to 20 images or documents (max 50MB per request) with best
          quality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {files.length === 0 ? (
            <div
              className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  Images: PNG, JPG, WEBP | Docs: PDF, DOCX, TXT (max 50MB, up to
                  20 files)
                </p>
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 border rounded px-2 py-1 bg-muted"
                  >
                    {IMAGE_TYPES.includes(file.type) ? (
                      <File className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs">{file.name}</span>
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
            </div>
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
        </form>
        {isPending && (
          <Progress value={undefined} className="animate-pulse mt-6" />
        )}
        {results.length > 0 && (
          <div className="mt-8">
            <Label className="text-center block mb-2">Compressed Files</Label>
            <div className="flex flex-col items-center gap-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 flex flex-col items-center"
                >
                  <p className="text-green-600 text-sm">{result.message}</p>
                  <Button className="mt-2" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download {result.fileName}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        {files.length > 0 && (
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Compressing..." : "Compress Files"}
          </Button>
        )}
      </CardFooter>
    </Card>
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
    <div
      className={`rounded-xl border p-6 shadow-md transition-shadow ${
        active ? "border-primary shadow-lg" : "bg-muted/30"
      }`}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-base">{description}</p>
    </div>
  );
}
