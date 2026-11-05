/**
 * Media types supported by the storage service, corresponding to the media record subroutes.
 */
export type MediaType = 'written' | 'audio' | 'video' | 'photo';

/**
 * Metadata recorded for each stored file in the mock storage.
 */
export interface StoredFileEntry {
  /** The unique incrementing numeric string key (e.g. "1", "2"). */
  key: string;
  /** Absolute or relative path where the file is stored on disk. */
  filepath: string;
  /** The media type category, if applicable. */
  mediaType?: MediaType;
  /** Byte size of the stored file. */
  byteSize?: number;
  /** Timestamp when the file was registered in ISO format. */
  createdAt: string;
}

/**
 * Options when storing a file.
 */
export interface StoreFileOptions {
  /** Associated media type category. */
  mediaType?: MediaType;
}

/**
 * Interface contract for MockStorage.
 */
export interface IMockStorage {
  /**
   * Stores a file to the specified filepath on disk and returns its key.
   * Creates any necessary parent directories.
   */
  storeFile(
    file: Buffer | Uint8Array | string,
    filepath: string,
    options?: StoreFileOptions
  ): Promise<string>;

  /**
   * Tracks an existing file at `filepath` and returns its key.
   */
  storeFileFromPath(filepath: string, options?: StoreFileOptions): string;

  /**
   * Convenience helper to store a file directly inside the dedicated folder for a media type.
   * e.g. `<baseDir>/photo/<filename>`
   */
  storeMedia(
    mediaType: MediaType,
    filename: string,
    file: Buffer | Uint8Array | string
  ): Promise<{ key: string; filepath: string }>;

  /**
   * Retrieves the filepath associated with a key. Returns undefined if the key does not exist.
   */
  getFilepath(key: string): string | undefined;

  /**
   * Retrieves the full entry metadata associated with a key.
   */
  getEntry(key: string): StoredFileEntry | undefined;

  /**
   * Gets the dedicated directory path for a specific media type.
   */
  getMediaDirectory(mediaType: MediaType): string;

  /**
   * Checks whether a key exists in storage.
   */
  has(key: string): boolean;

  /**
   * Deletes a tracked file by key, optionally deleting the file on disk.
   */
  deleteFile(key: string, removeDiskFile?: boolean): Promise<boolean>;

  /**
   * Clears all tracked files and resets key counter, optionally deleting disk files.
   */
  clear(removeDiskFiles?: boolean): Promise<void>;

  /**
   * Returns all keys currently tracked in storage.
   */
  getAllKeys(): string[];
}
