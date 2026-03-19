import { useCallback, useState } from 'react';
import { imageApi } from '../lib/api';
import type { ImageUploadResponse } from '../lib/api';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseImageUploadOptions {
  userId: string;
  onSuccess?: (response: ImageUploadResponse) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: UploadProgress) => void;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function calculateHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToHex(hashBuffer);
}

export function useImageUpload(options: UseImageUploadOptions) {
  const { userId, onSuccess, onError, onProgress } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });

  const compressImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        const TARGET_SIZE = 300 * 1024;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === 'image/png';
        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(new Blob([file], { type: file.type }));
                return;
              }
              if (blob.size > TARGET_SIZE && quality > 0.2) {
                tryCompress(quality - 0.15);
              } else {
                resolve(blob);
              }
            },
            isPng ? 'image/png' : 'image/jpeg',
            quality
          );
        };

        tryCompress(0.85);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const upload = useCallback(async (file: File): Promise<ImageUploadResponse | null> => {
    if (!userId) {
      toast.error('请先登录');
      return null;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('图片大小不能超过50MB');
      return null;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return null;
    }

    setUploading(true);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const compressed = await compressImage(file);
      setProgress({ loaded: file.size * 0.5, total: file.size, percentage: 50 });

      const finalFile = new File([compressed], file.name, { type: compressed.type });

      const buffer = await finalFile.arrayBuffer();
      const fileHash = await calculateHash(buffer);

      setProgress({ loaded: file.size * 0.7, total: file.size, percentage: 70 });

      const skipCheck = await imageApi.checkSkipUpload(fileHash);
      if (skipCheck.data?.skip && skipCheck.data.url) {
        const response: ImageUploadResponse = {
          objectKey: skipCheck.data.objectKey!,
          url: skipCheck.data.url,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        };
        onSuccess?.(response);
        toast.success('图片秒传成功');
        setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        setUploading(false);
        return response;
      }

      setProgress({ loaded: file.size * 0.8, total: file.size, percentage: 80 });

      const formData = new FormData();
      formData.append('file', finalFile);
      formData.append('userId', userId);

      const response = await imageApi.upload(finalFile, userId);

      if (response.data) {
        onSuccess?.(response.data);
        toast.success('图片上传成功');
        setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        onProgress?.({ loaded: file.size, total: file.size, percentage: 100 });
        setUploading(false);
        return response.data;
      }

      setUploading(false);
      return null;
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('图片上传失败');
      onError?.('图片上传失败');
      setUploading(false);
      return null;
    }
  }, [userId, compressImage, onSuccess, onError, onProgress]);

  const resetProgress = useCallback(() => {
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  }, []);

  return {
    upload,
    uploading,
    progress,
    resetProgress,
  };
}
