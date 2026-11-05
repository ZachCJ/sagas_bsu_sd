import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MockStorage } from './mock-storage';
import type { MediaType } from './types';

/**
 * Testing for mock storage on the Capture API server will be deprecrated with AWS S3 storage functionality
 */

describe('MockStorage', () => {
  let storage: MockStorage;
  let testBaseDir: string;

  beforeEach(() => {
    testBaseDir = join(tmpdir(), `mock-storage-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    storage = new MockStorage(testBaseDir);
  });

  afterEach(async () => {
    try {
      await rm(testBaseDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error in temp dir
    }
  });

  // Testing key incrementation
  it('starts with key "1" and increments sequentially with each file added', async () => {
    const key1 = await storage.storeFile('first content', join(testBaseDir, 'test1.txt'));
    const key2 = await storage.storeFile('second content', join(testBaseDir, 'test2.txt'));
    const key3 = await storage.storeFile('third content', join(testBaseDir, 'test3.txt'));

    expect(key1).toBe('1');
    expect(key2).toBe('2');
    expect(key3).toBe('3');
  });

  //Making sure keys and filepaths are mapping properly
  it('stores a file to a filepath and retrieves the filepath from its key', async () => {
    const targetPath = join(testBaseDir, 'documents', 'sample.txt');
    const content = 'Hello, Bitweavers mock storage!';

    const key = await storage.storeFile(content, targetPath);
    expect(key).toBe('1');

    const retrievedPath = storage.getFilepath(key);
    expect(retrievedPath).toBe(targetPath);

    // Verify the file was actually written to disk
    if (!retrievedPath) {
      throw new Error('Expected a filepath for the stored file');
    }

    const diskContent = await readFile(retrievedPath, 'utf8');
    expect(diskContent).toBe(content);
  });

  //Handling non-existent key cases
  it('returns undefined when querying an unrecorded key', () => {
    expect(storage.getFilepath('unknown-key')).toBeUndefined();
    expect(storage.getFilepath('999')).toBeUndefined();
  });

  //Testing the folder breakdown for types
  it('provides dedicated media folders for written, audio, video, photo', async () => {
    const mediaTypes: MediaType[] = ['written', 'audio', 'video', 'photo'];

    for (const type of mediaTypes) {
      const dir = storage.getMediaDirectory(type);
      expect(dir).toBe(join(testBaseDir, type));

      const filename = `sample.${type === 'photo' ? 'jpg' : type === 'audio' ? 'wav' : type === 'video' ? 'mp4' : 'txt'}`;
      const result = await storage.storeMedia(type, filename, `data for ${type}`);

      expect(result.filepath).toBe(join(dir, filename));
      expect(storage.getFilepath(result.key)).toBe(result.filepath);

      // Verify file exists on disk
      const savedData = await readFile(result.filepath, 'utf8');
      expect(savedData).toBe(`data for ${type}`);
    }
  });

  //Testing tracking existing files of a type
  it('tracks an existing file via storeFileFromPath', () => {
    const existingPath = '/tmp/fake-media-file.jpg';
    const key = storage.storeFileFromPath(existingPath, { mediaType: 'photo' });

    expect(key).toBe('1');
    expect(storage.getFilepath(key)).toBe(existingPath);

    const entry = storage.getEntry(key);
    expect(entry).toBeDefined();
    expect(entry?.mediaType).toBe('photo');
    expect(entry?.filepath).toBe(existingPath);
  });

  //Testing existence checks
  it('checks key existence with has() and retrieves all keys', async () => {
    const key1 = await storage.storeFile('a', join(testBaseDir, 'a.txt'));
    const key2 = await storage.storeFile('b', join(testBaseDir, 'b.txt'));

    expect(storage.has(key1)).toBe(true);
    expect(storage.has(key2)).toBe(true);
    expect(storage.has('999')).toBe(false);

    expect(storage.getAllKeys()).toEqual(['1', '2']);
  });

  // Testing delete functionality
  it('deletes a file record and optionally removes it from disk', async () => {
    const filePath = join(testBaseDir, 'to-delete.txt');
    const key = await storage.storeFile('delete me', filePath);

    expect(storage.getFilepath(key)).toBe(filePath);

    // Delete with removeDiskFile = true
    const deleted = await storage.deleteFile(key, true);
    expect(deleted).toBe(true);
    expect(storage.getFilepath(key)).toBeUndefined();
    expect(storage.has(key)).toBe(false);

    // File should no longer exist on disk
    await expect(readFile(filePath)).rejects.toThrow();
  });

  // Build multiple entries and clear test
  it('clears all entries and resets the key counter back to 1', async () => {
    await storage.storeFile('f1', join(testBaseDir, 'f1.txt'));
    await storage.storeFile('f2', join(testBaseDir, 'f2.txt'));
    expect(storage.getAllKeys().length).toBe(2);

    await storage.clear(true);
    expect(storage.getAllKeys().length).toBe(0);

    // Storing a new file after clear resets the key to "1"
    const nextKey = await storage.storeFile('new-f', join(testBaseDir, 'new.txt'));
    expect(nextKey).toBe('1');
  });
});
