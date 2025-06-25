"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useTransition,
  useActionState,
} from "react";
import Image from "next/image";
import { convertImage, type ConversionState } from "@/app/actions";

import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Wand2,
  UploadCloud,
  FileImage,
  ArrowRight,
  Download,
  RefreshCw,
  X,
} from "lucide-react";

export default function ImageConverter() {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ImageConverterUI
      key={resetKey}
      onReset={() => setResetKey((k) => k + 1)}
    />
  );
}

function ImageConverterUI({ onReset }: { onReset: () => void }) {
  const [formState, formAction] = useActionState(convertImage, {
    message: null,
    results: [],
    error: null,
  });
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const downloadLinksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [originalPreviews, setOriginalPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const conversionDirection = useMemo(() => {
    if (originalFiles.length === 0) return null;
    return originalFiles[0].type === "image/webp" ? "to-png" : "to-webp";
  }, [originalFiles]);

  const handleFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const previews: string[] = [];
    Array.from(files)
      .slice(0, 20)
      .forEach((file) => {
        if (
          !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
            file.type
          )
        ) {
          toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please upload a PNG, JPG, or WebP image.",
          });
          return;
        }
        validFiles.push(file);
        previews.push(URL.createObjectURL(file));
      });
    // Clean up old previews
    originalPreviews.forEach((url) => URL.revokeObjectURL(url));
    setOriginalFiles(validFiles);
    setOriginalPreviews(previews);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleReset = () => {
    originalPreviews.forEach((url) => URL.revokeObjectURL(url));
    setOriginalFiles([]);
    setOriginalPreviews([]);
    onReset();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (originalFiles.length === 0) return;
    const formData = new FormData();
    originalFiles.forEach((file, idx) => {
      formData.append("images", file);
      // Optionally, you can set conversion type per file if needed
      formData.append(
        "conversionTypes",
        file.type === "image/webp" ? "to-png" : "to-webp"
      );
    });
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (formState.message) {
      if (formState.error) {
        toast({
          variant: "destructive",
          title: "Conversion Failed",
          description: formState.message,
        });
      } else {
        toast({ title: "Success!", description: formState.message });
        if (
          formState.results &&
          formState.results[0]?.convertedImage &&
          downloadLinksRef.current[0]
        ) {
          downloadLinksRef.current[0]?.click();
        }
      }
    }
  }, [formState, toast]);

  useEffect(() => {
    if (formState.results && formState.results.length > 0) {
      formState.results.forEach((result, idx) => {
        if (result.convertedImage && downloadLinksRef.current[idx]) {
          downloadLinksRef.current[idx]?.click();
        }
      });
    }
  }, [formState]);

  useEffect(() => {
    return () => {
      originalPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [originalPreviews]);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/10">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wand2 className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold tracking-tight">
            WebPifier
          </CardTitle>
        </div>
        <CardDescription className="text-lg">
          Effortlessly convert your images to and from the modern WebP format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {originalFiles.length === 0 ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                dragActive
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, or WEBP (max 10MB each, up to 20 files)
                </p>
              </div>
              <Input
                ref={fileInputRef}
                id="images"
                name="images"
                type="file"
                className="hidden"
                onChange={handleChange}
                accept="image/png, image/jpeg, image/webp"
                multiple
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label className="text-center block">Original Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {originalPreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video w-full rounded-lg overflow-hidden border"
                      >
                        <Image
                          src={preview}
                          alt={`Original image preview ${idx + 1}`}
                          fill
                          className="object-contain"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/50 hover:bg-background/80 rounded-full h-8 w-8"
                          onClick={handleReset}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove image</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-center block">Converted Image</Label>
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                    {isPending ? (
                      <div className="w-full max-w-xs space-y-3 p-4">
                        <p className="text-center text-muted-foreground">
                          Converting...
                        </p>
                        <Progress value={undefined} className="animate-pulse" />
                      </div>
                    ) : formState.results &&
                      formState.results[0]?.convertedImage ? (
                      <Image
                        src={formState.results[0]?.convertedImage}
                        alt="Converted image preview"
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileImage className="h-12 w-12 mx-auto" />
                        <p className="mt-2">
                          Your converted image will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center text-lg font-medium text-muted-foreground flex items-center justify-center gap-4">
                <span>
                  {originalFiles.length > 0
                    ? originalFiles[0].name.split(".").pop()?.toUpperCase()
                    : ""}
                </span>
                <ArrowRight className="h-6 w-6 text-primary" />
                <span>
                  {conversionDirection === "to-webp" ? "WEBP" : "PNG"}
                </span>
              </div>
            </div>
          )}

          <input
            type="hidden"
            name="conversionType"
            value={conversionDirection || ""}
          />
        </form>
        {formState.results && formState.results.length > 0 && (
          <div className="mt-8">
            <Label className="text-center block mb-2">Converted Images</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formState.results.map((result, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 flex flex-col items-center"
                >
                  {result.convertedImage ? (
                    <>
                      <Image
                        src={result.convertedImage}
                        alt={`Converted image ${idx + 1}`}
                        width={200}
                        height={120}
                        className="object-contain rounded mb-2"
                      />
                      <a
                        ref={(el) => {
                          downloadLinksRef.current[idx] = el;
                          return undefined;
                        }}
                        href={result.convertedImage}
                        download={
                          result.fileName || `converted-image-${idx + 1}`
                        }
                        className="hidden"
                      >
                        Download
                      </a>
                      <Button
                        size="sm"
                        onClick={() => downloadLinksRef.current[idx]?.click()}
                        className="mb-2"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <p className="text-green-600 text-sm">{result.message}</p>
                    </>
                  ) : (
                    <>
                      <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-red-600 text-sm">{result.message}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        {originalFiles.length > 0 &&
          formState.results &&
          !formState.results.some((r) => r.convertedImage) && (
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              onClick={() => formRef.current?.requestSubmit()}
            >
              {isPending ? "Converting..." : "Convert Images"}
              {!isPending && <Wand2 className="ml-2 h-5 w-5" />}
            </Button>
          )}

        {formState.results && formState.results.length > 0 && (
          <>
            <Button variant="outline" size="lg" onClick={handleReset}>
              <RefreshCw className="mr-2 h-5 w-5" />
              Convert Another
            </Button>
            <Button
              size="lg"
              onClick={() => downloadLinksRef.current[0]?.click()}
              className="animate-pulse-subtle"
            >
              <Download className="mr-2 h-5 w-5" />
              Download First
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
