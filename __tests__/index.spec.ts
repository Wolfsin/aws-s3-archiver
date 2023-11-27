import { describe, expect, it, vi } from 'vitest';
import * as s3Wrapper from '../src/s3Wrapper';
import { s3Zip } from '../src/index';
import { Readable } from 'stream';
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
        spyUploadObject.mockResolvedValue();
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
                [],
                'targetBucket',
                'targetPath',
                'archive',
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
                ['file1.txt', 'file2.txt'],
                'targetBucket',
                'targetPath',
                'archive',
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
});
