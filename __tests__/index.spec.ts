import { describe, expect, it, vi } from 'vitest';
import * as s3Wrapper from '../src/s3Wrapper';
import { s3Zip } from '../src/index';
import { PassThrough, Readable } from 'stream';
import { sdkStreamMixin } from '@smithy/util-stream';
import { S3Client } from '@aws-sdk/client-s3';

describe('index', () => {
    const mocks = vi.hoisted(() => {
        return {
            mockArchiver: vi.fn(),
            mockArchiverAppend: vi.fn(),
            mockArchiverFinalize: vi.fn(),
        };
    });
    vi.mock('archiver', () => {
        return {
            default: mocks.mockArchiver.mockImplementation(() => {
                return {
                    pipe: vi.fn(),
                    append: mocks.mockArchiverAppend,
                    finalize: mocks.mockArchiverFinalize,
                };
            }),
        };
    });
    const spyGetObjectStream = vi.spyOn(s3Wrapper, 'getObjectStream');
    const spyListObjects = vi.spyOn(s3Wrapper, 'listObjects');
    const spyUploadObject = vi.spyOn(s3Wrapper, 'uploadObject');
    const fileStreamWithFile1 = new Readable();
    fileStreamWithFile1.push('file1');
    fileStreamWithFile1.push(null);
    const sdkStreamWithFile1 = sdkStreamMixin(fileStreamWithFile1);
    const fileStreamWithFile2 = new Readable();
    fileStreamWithFile2.push('file2');
    fileStreamWithFile2.push(null);
    const sdkStreamWithFile2 = sdkStreamMixin(fileStreamWithFile2);

    beforeEach(() => {
        spyGetObjectStream
            .mockResolvedValueOnce(sdkStreamWithFile1)
            .mockResolvedValueOnce(sdkStreamWithFile2);
        spyListObjects.mockResolvedValue(['file1.txt', 'file2.txt']);
        spyUploadObject.mockResolvedValue({ $metadata: { httpStatusCode: 200 } });
    });
    afterEach(() => {
        spyGetObjectStream.mockReset();
        spyListObjects.mockReset();
        spyUploadObject.mockReset();
        mocks.mockArchiver.mockClear();
        mocks.mockArchiverAppend.mockClear();
    });
    describe('sourceFileList is empty', () => {
        beforeEach(async () => {
            await s3Zip(
                'sourceBucket',
                'sourcePath',
                'archive',
                [],
                'targetBucket',
                'targetPath',
                { region: 'ap-northeast-1' },
                { zlib: { level: 0 } },
            );
        });
        it('calls listObjects when sourceFileList is empty', () => {
            expect(spyListObjects).toHaveBeenCalledWith(
                expect.any(S3Client),
                'sourceBucket',
                'sourcePath',
            );
        });
    });
    describe('sourceFileList is not empty', () => {
        beforeEach(async () => {
            await s3Zip(
                'sourceBucket',
                'sourcePath',
                'archive',
                ['file1.txt', 'file2.txt'],
                'targetBucket',
                'targetPath',
                { region: 'ap-northeast-1' },
                { zlib: { level: 0 } },
            );
        });
        it('correctly sets the parameters when calling archiver', () => {
            expect(mocks.mockArchiver).toHaveBeenCalledWith('zip', { zlib: { level: 0 } });
        });
        it('calls getObjectStream for each item in the sourceFileList', () => {
            expect(spyGetObjectStream).toHaveBeenCalledTimes(2);
            expect(spyGetObjectStream).toHaveBeenNthCalledWith(
                1,
                expect.any(S3Client),
                'sourceBucket',
                'sourcePath',
                'file1.txt',
            );
            expect(spyGetObjectStream).toHaveBeenNthCalledWith(
                2,
                expect.any(S3Client),
                'sourceBucket',
                'sourcePath',
                'file2.txt',
            );
        });
        it('calls archiver append with correct parameters for each file in the sourceFileList', () => {
            expect(mocks.mockArchiverAppend).toHaveBeenCalledWith(sdkStreamWithFile1, {
                name: 'file1.txt',
            });
            expect(mocks.mockArchiverAppend).toHaveBeenCalledWith(sdkStreamWithFile2, {
                name: 'file2.txt',
            });
        });
    });
    it('sets default values correctly when targetFileName is undefined', async () => {
        await s3Zip(
            'sourceBucket',
            'sourcePath',
            undefined,
            ['file1.txt', 'file2.txt'],
            'targetBucket',
            'targetPath',
            { region: 'ap-northeast-1' },
            { zlib: { level: 0 } },
        );
        expect(spyUploadObject).toHaveBeenCalledWith(
            expect.any(S3Client),
            'targetBucket',
            'targetPath',
            'archive.zip',
            expect.any(PassThrough),
        );
    });
    it('sets default values correctly when targetBucket is undefined', async () => {
        await s3Zip(
            'sourceBucket',
            'sourcePath',
            'archive',
            ['file1.txt', 'file2.txt'],
            undefined,
            'targetPath',
            { region: 'ap-northeast-1' },
            { zlib: { level: 0 } },
        );
        expect(spyUploadObject).toHaveBeenCalledWith(
            expect.any(S3Client),
            'sourceBucket',
            'targetPath',
            'archive.zip',
            expect.any(PassThrough),
        );
    });
    it('sets default values correctly when targetPath is undefined', async () => {
        await s3Zip(
            'sourceBucket',
            'sourcePath',
            'archive',
            ['file1.txt', 'file2.txt'],
            'targetBucket',
            undefined,
            { region: 'ap-northeast-1' },
            { zlib: { level: 0 } },
        );
        expect(spyUploadObject).toHaveBeenCalledWith(
            expect.any(S3Client),
            'targetBucket',
            'sourcePath',
            'archive.zip',
            expect.any(PassThrough),
        );
    });
    it('sets default values correctly when zipOptions is undefined', async () => {
        await s3Zip(
            'sourceBucket',
            'sourcePath',
            'archive',
            ['file1.txt', 'file2.txt'],
            'targetBucket',
            'targetPath',
            { region: 'ap-northeast-1' },
        );
        expect(mocks.mockArchiver).toHaveBeenCalledWith('zip', {});
    });
    it('throws error when sourceBucket is empty', async () => {
        await expect(() =>
            s3Zip(
                '',
                'sourcePath',
                'archive',
                ['file1.txt', 'file2.txt'],
                'targetBucket',
                'targetPath',
                { region: 'ap-northeast-1' },
                { zlib: { level: 0 } },
            ),
        ).rejects.toThrowError('sourceBucket is empty');
    });
    it('throws error when sourcePath is empty', async () => {
        await expect(() =>
            s3Zip(
                'sourceBucket',
                '',
                'archive',
                ['file1.txt', 'file2.txt'],
                'targetBucket',
                'targetPath',
                { region: 'ap-northeast-1' },
                { zlib: { level: 0 } },
            ),
        ).rejects.toThrowError('sourcePath is empty');
    });
    it('throws error when targetFileName is empty', async () => {
        await expect(() =>
            s3Zip(
                'sourceBucket',
                'sourcePath',
                '',
                ['file1.txt', 'file2.txt'],
                'targetBucket',
                'targetPath',
                { region: 'ap-northeast-1' },
                { zlib: { level: 0 } },
            ),
        ).rejects.toThrowError('targetFileName is empty');
    });
    it('throws error when targetBucket is empty', async () => {
        await expect(() =>
            s3Zip(
                'sourceBucket',
                'sourcePath',
                'archive',
                ['file1.txt', 'file2.txt'],
                '',
                'targetPath',
                { region: 'ap-northeast-1' },
                { zlib: { level: 0 } },
            ),
        ).rejects.toThrowError('targetBucket is empty');
    });
    it('throws error when targetPath is empty', async () => {
        await expect(() =>
            s3Zip(
                'sourceBucket',
                'sourcePath',
                'archive',
                ['file1.txt', 'file2.txt'],
                'targetBucket',
                '',
                { region: 'ap-northeast-1' },
                { zlib: { level: 0 } },
            ),
        ).rejects.toThrowError('targetPath is empty');
    });
});
