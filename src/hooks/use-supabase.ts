import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { useUser } from '@clerk/clerk-react';

export interface FileRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  ipfs_hash: string;
  upload_type: 'traditional' | 'web3';
  token_id?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface StorageStats {
  total_files: number;
  total_size: number;
  ipfs_files: number;
  nft_files: number;
}

export const useSupabase = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save file record to database
  const saveFileRecord = useCallback(async (fileData: Omit<FileRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          ...fileData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save file record';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get user's files
  const getUserFiles = useCallback(async (): Promise<FileRecord[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user files';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get storage statistics
  const getStorageStats = useCallback(async (): Promise<StorageStats> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('files')
        .select('file_size, upload_type')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats = data.reduce(
        (acc, file) => {
          acc.total_files += 1;
          acc.total_size += file.file_size;
          if (file.upload_type === 'traditional') {
            acc.ipfs_files += 1;
          } else {
            acc.nft_files += 1;
          }
          return acc;
        },
        { total_files: 0, total_size: 0, ipfs_files: 0, nft_files: 0 }
      );

      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch storage stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Delete file record
  const deleteFileRecord = useCallback(async (fileId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file record';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update file record
  const updateFileRecord = useCallback(async (fileId: string, updates: Partial<FileRecord>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('files')
        .update(updates)
        .eq('id', fileId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update file record';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    loading,
    error,
    saveFileRecord,
    getUserFiles,
    getStorageStats,
    deleteFileRecord,
    updateFileRecord,
  };
};