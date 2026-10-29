import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IMockStorage, MediaType, StoreFileOptions, StoredFileEntry } from './types';

const defaultBaseDir = fileURLToPath(new URL('./data', import.meta.url));

/**
 * MockStorage implementation for storing files in local media folders
 * and tracking them using incremental numeric string keys ("1", "2", ...).
 */
export class MockStorage implements IMockStorage {
  private readonly entries = new Map<string, StoredFileEntry>();
  private nextKeyId = 1;
  readonly baseDir: string;

  constructor(baseDir: string = defaultBaseDir) {
    this.baseDir = resolve(baseDir);
  }

  /**
   * Generates an incrementing numeric string key ("1", "2", "3", ...).
   */
  private generateKey(): string {
    const key = String(this.nextKeyId);
    this.nextKeyId += 1;
    return key;
  }

  /**
   * Returns the directory path for a specific media type.
   */
  getMediaDirectory(mediaType: MediaType): string {
    return join(this.baseDir, mediaType);
  }

  /**
   * Stores a file directly to the given filepath on disk and returns its key.
   */
  async storeFile(
    file: Buffer | Uint8Array | string,
    filepath: string,
    options?: StoreFileOptions
  ): Promise<string> {
    const resolvedPath = resolve(filepath);
    await mkdir(dirname(resolvedPath), { recursive: true });
    await writeFile(resolvedPath, file);

    const key = this.generateKey();
    const byteSize =
      typeof file === 'string'
        ? Buffer.byteLength(file, 'utf8')
        : file.byteLength;

    this.entries.set(key, {
      key,
      filepath: resolvedPath,
      mediaType: options?.mediaType,
      byteSize,
      createdAt: new Date().toISOString(),
    });

    return key;
  }

  /**
   * Registers an existing file at `filepath` and returns its key.
   */
  storeFileFromPath(filepath: string, options?: StoreFileOptions): string {
    const resolvedPath = resolve(filepath);
    const key = this.generateKey();

    this.entries.set(key, {
      key,
      filepath: resolvedPath,
      mediaType: options?.mediaType,
      createdAt: new Date().toISOString(),
    });

    return key;
  }

  /**
   * Convenience helper to store a file directly inside the dedicated folder
   * for the given media type (written, audio, video, photo).
   */
  async storeMedia(
    mediaType: MediaType,
    filename: string,
    file: Buffer | Uint8Array | string
  ): Promise<{ key: string; filepath: string }> {
    const targetPath = join(this.getMediaDirectory(mediaType), filename);
    const key = await this.storeFile(file, targetPath, { mediaType });
    return { key, filepath: targetPath };
  }

  /**
   * Returns the filepath associated with the key, or undefined if not found.
   */
  getFilepath(key: string): string | undefined {
    return this.entries.get(key)?.filepath;
  }

  /**
   * Returns metadata entry for the given key, or undefined if not found.
   */
  getEntry(key: string): StoredFileEntry | undefined {
    return this.entries.get(key);
  }

  /**
   * Returns whether a key exists in storage.
   */
  has(key: string): boolean {
    return this.entries.has(key);
  }

  /**
   * Deletes a tracked file by key.
   */
  async deleteFile(key: string, removeDiskFile = false): Promise<boolean> {
    const entry = this.entries.get(key);
    if (!entry) {
      return false;
    }

    if (removeDiskFile) {
      try {
        await rm(entry.filepath, { force: true });
      } catch {
        // Ignored if file does not exist on disk
      }
    }

    return this.entries.delete(key);
  }

  /**
   * Clears all stored entries and resets the key counter back to 1.
   */
  async clear(removeDiskFiles = false): Promise<void> {
    if (removeDiskFiles) {
      for (const entry of this.entries.values()) {
        try {
          await rm(entry.filepath, { force: true });
        } catch {
          // Ignored
        }
      }
    }
    this.entries.clear();
    this.nextKeyId = 1;
  }

  /**
   * Returns all stored keys.
   */
  getAllKeys(): string[] {
    return Array.from(this.entries.keys());
  }
}
