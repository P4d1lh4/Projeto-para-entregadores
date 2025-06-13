import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface UseSupabaseStorageOptions {
  bucketName: string;
  autoCreateBucket?: boolean;
  isPublic?: boolean;
  allowedMimeTypes?: string[];
  fileSizeLimit?: number;
}

interface UseSupabaseStorageReturn {
  // State
  files: StorageFile[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  bucketExists: boolean | null;

  // Actions
  ensureBucketExists: () => Promise<boolean>;
  uploadFile: (file: File, options?: { customName?: string; metadata?: Record<string, any> }) => Promise<{ success: boolean; data?: any; error?: string }>;
  downloadFile: (fileName: string) => Promise<{ success: boolean; error?: string }>;
  deleteFile: (fileName: string) => Promise<{ success: boolean; error?: string }>;
  listFiles: () => Promise<{ success: boolean; files?: StorageFile[]; error?: string }>;
  getPublicUrl: (fileName: string) => string | null;
  createSignedUrl: (fileName: string, expiresIn?: number) => Promise<{ success: boolean; url?: string; error?: string }>;
}

export const useSupabaseStorage = (options: UseSupabaseStorageOptions): UseSupabaseStorageReturn => {
  const {
    bucketName,
    autoCreateBucket = true,
    isPublic = false,
    allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    fileSizeLimit = 200 * 1024 * 1024 // 200MB (increased from 50MB)
  } = options;

  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Ensure bucket exists, create if needed
  const ensureBucketExists = useCallback(async (): Promise<boolean> => {
    try {
      // List buckets to check if our bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        setBucketExists(false);
        return false;
      }

      const exists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (exists) {
        setBucketExists(true);
        return true;
      }

      if (!autoCreateBucket) {
        setBucketExists(false);
        toast({
          title: 'Storage Bucket Not Found',
          description: `Storage bucket "${bucketName}" does not exist and auto-creation is disabled`,
          variant: 'destructive'
        });
        return false;
      }

      // Since bucket creation is restricted by RLS, provide instructions for manual creation
      setBucketExists(false);
      toast({
        title: 'Storage Bucket Required',
        description: `Please create the storage bucket "${bucketName}" manually in the Supabase dashboard under Storage. Make it ${isPublic ? 'public' : 'private'}.`,
        variant: 'destructive'
      });

      return false;

    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      setBucketExists(false);
      toast({
        title: 'Storage Error',
        description: 'Failed to initialize storage. Please check your permissions.',
        variant: 'destructive'
      });
      return false;
    }
  }, [bucketName, autoCreateBucket, isPublic, toast]);

  // Upload file to storage
  const uploadFile = useCallback(async (
    file: File, 
    options?: { customName?: string; metadata?: Record<string, any> }
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    if (!bucketExists) {
      const ready = await ensureBucketExists();
      if (!ready) {
        return { success: false, error: 'Storage not ready' };
      }
    }

    // Validate file size
    if (file.size > fileSizeLimit) {
      const error = `File too large. Maximum size is ${Math.round(fileSizeLimit / 1024 / 1024)}MB`;
      toast({
        title: 'Upload Error',
        description: error,
        variant: 'destructive'
      });
      return { success: false, error };
    }

    // Validate file type
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
      const error = 'File type not allowed';
      toast({
        title: 'Upload Error',
        description: error,
        variant: 'destructive'
      });
      return { success: false, error };
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = options?.customName || `${timestamp}_${file.name}`;

      setUploadProgress(25);

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          metadata: options?.metadata
        });

      setUploadProgress(75);

      if (error) {
        throw error;
      }

      setUploadProgress(100);

      toast({
        title: 'Upload Successful',
        description: `${file.name} uploaded successfully`
      });

      // Refresh file list
      await listFiles();

      return { success: true, data };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [bucketExists, bucketName, fileSizeLimit, allowedMimeTypes, toast, ensureBucketExists]);

  // Download file from storage
  const downloadFile = useCallback(async (fileName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileName);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.split('_').slice(1).join('_'); // Remove timestamp prefix if exists
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: `Downloading ${fileName.split('_').slice(1).join('_')}`
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    }
  }, [bucketName, toast]);

  // Delete file from storage
  const deleteFile = useCallback(async (fileName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      toast({
        title: 'File Deleted',
        description: `${fileName.split('_').slice(1).join('_')} removed from storage`
      });

      // Refresh file list
      await listFiles();

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    }
  }, [bucketName, toast]);

  // List files in bucket
  const listFiles = useCallback(async (): Promise<{ success: boolean; files?: StorageFile[]; error?: string }> => {
    setIsLoading(true);
    try {
      const { data: fileList, error } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      setFiles(fileList || []);
      return { success: true, files: fileList || [] };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list files';
      console.error('List files error:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [bucketName, toast]);

  // Get public URL for file
  const getPublicUrl = useCallback((fileName: string): string | null => {
    try {
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Get public URL error:', error);
      return null;
    }
  }, [bucketName]);

  // Create signed URL for private files
  const createSignedUrl = useCallback(async (
    fileName: string, 
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        throw error;
      }

      return { success: true, url: data.signedUrl };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create signed URL';
      console.error('Create signed URL error:', error);
      return { success: false, error: errorMessage };
    }
  }, [bucketName]);

  return {
    // State
    files,
    isLoading,
    isUploading,
    uploadProgress,
    bucketExists,

    // Actions
    ensureBucketExists,
    uploadFile,
    downloadFile,
    deleteFile,
    listFiles,
    getPublicUrl,
    createSignedUrl
  };
}; 