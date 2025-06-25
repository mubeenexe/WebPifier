
'use client';

import { useState, useRef, useEffect, useMemo, useTransition, useActionState } from 'react';
import Image from 'next/image';
import { convertImage, type ConversionState } from '@/app/actions';

import { useToast } from "@/hooks/use-toast"
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Wand2, UploadCloud, FileImage, ArrowRight, Download, RefreshCw, X } from 'lucide-react';

const initialState: ConversionState = {
  message: null,
  convertedImage: null,
  fileName: null,
  error: null,
};

export default function ImageConverter() {
  const [resetKey, setResetKey] = useState(0);
  return <ImageConverterUI key={resetKey} onReset={() => setResetKey(k => k + 1)} />;
}

function ImageConverterUI({ onReset }: { onReset: () => void }) {
  const [formState, formAction] = useActionState(convertImage, initialState);
  const [isPending, startTransition] = useTransition();

  const formRef = useRef<HTMLFormElement>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const conversionDirection = useMemo(() => {
    if (!originalFile) return null;
    return originalFile.type === 'image/webp' ? 'to-png' : 'to-webp';
  }, [originalFile]);

  const handleFile = (file: File | undefined) => {
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a PNG, JPG, or WebP image.' });
        return;
      }
      if (originalPreview) {
        URL.revokeObjectURL(originalPreview);
      }
      setOriginalFile(file);
      setOriginalPreview(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (!originalFile) return;
    formData.set('image', originalFile);
    if (conversionDirection) {
      formData.set('conversionType', conversionDirection);
    }
    startTransition(() => {
        formAction(formData);
    });
  };

  useEffect(() => {
    if (formState.message) {
      if (formState.error) {
        toast({ variant: 'destructive', title: 'Conversion Failed', description: formState.message });
      } else {
        toast({ title: 'Success!', description: formState.message });
        if (formState.convertedImage && downloadLinkRef.current) {
          downloadLinkRef.current.click();
        }
      }
    }
  }, [formState, toast]);

  useEffect(() => {
    return () => {
      if (originalPreview) {
        URL.revokeObjectURL(originalPreview);
      }
    };
  }, [originalPreview]);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-primary/10">
      <CardHeader>
        <div className="flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold tracking-tight">WebPifier</CardTitle>
        </div>
        <CardDescription className="text-lg">
          Effortlessly convert your images to and from the modern WebP format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {!originalFile ? (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn("relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors", 
                dragActive ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold text-foreground">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, or WEBP (max 10MB)</p>
              </div>
              <Input ref={fileInputRef} id="image" name="image" type="file" className="hidden" onChange={handleChange} accept="image/png, image/jpeg, image/webp"/>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <Label className="text-center block">Original Image</Label>
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                    <Image src={originalPreview!} alt="Original image preview" fill className="object-contain" />
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50 hover:bg-background/80 rounded-full h-8 w-8" onClick={onReset}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-center block">Converted Image</Label>
                   <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center">
                    {isPending ? (
                      <div className="w-full max-w-xs space-y-3 p-4">
                        <p className="text-center text-muted-foreground">Converting...</p>
                        <Progress value={undefined} className="animate-pulse" />
                      </div>
                    ) : formState.convertedImage ? (
                      <Image src={formState.convertedImage} alt="Converted image preview" fill className="object-contain" />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <FileImage className="h-12 w-12 mx-auto" />
                            <p className="mt-2">Your converted image will appear here</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>

               <div className="text-center text-lg font-medium text-muted-foreground flex items-center justify-center gap-4">
                    <span>{originalFile.name.split('.').pop()?.toUpperCase()}</span>
                    <ArrowRight className="h-6 w-6 text-primary"/>
                    <span>{conversionDirection === 'to-webp' ? 'WEBP' : 'PNG'}</span>
              </div>
            </div>
          )}
          
          <input type="hidden" name="conversionType" value={conversionDirection || ''} />

        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        {originalFile && !formState.convertedImage && (
             <Button type="submit" size="lg" disabled={isPending} onClick={() => formRef.current?.requestSubmit()}>
                {isPending ? "Converting..." : "Convert Image"}
                {!isPending && <Wand2 className="ml-2 h-5 w-5" />}
            </Button>
        )}
        
        {formState.convertedImage && (
            <>
                <Button variant="outline" size="lg" onClick={onReset}>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Convert Another
                </Button>
                <a
                    ref={downloadLinkRef}
                    href={formState.convertedImage}
                    download={formState.fileName || 'converted-image'}
                    className="hidden"
                >
                    Download
                </a>
                <Button size="lg" onClick={() => downloadLinkRef.current?.click()} className="animate-pulse-subtle">
                    <Download className="mr-2 h-5 w-5" />
                    Download
                </Button>
            </>
        )}
      </CardFooter>
    </Card>
  );
}
