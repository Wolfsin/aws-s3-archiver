import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { sdkStreamMixin } from '@smithy/util-stream';
import { Readable } from 'stream';

import { describe, expect, it, vi } from 'vitest';
import { listObjects, getObjectStream, uploadObject } from '../src/s3Wrapper';

const s3Mock = mockClient(S3Client);
const mocks = vi.hoisted(() => {
    return {
        mockUpload: vi.fn(),
        mockUploadDone: vi.fn(),
    };
});
vi.mock('@aws-sdk/lib-storage', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@aws-sdk/lib-storage')>();
    return {
        ...actual,
        Upload: mocks.mockUpload.mockImplementation(() => {
            return {
                done: mocks.mockUploadDone,
            };
        }),
    };
});
describe('s3Wrapper', () => {
    describe('listObjects', () => {
        beforeEach(() => {
            s3Mock.on(ListObjectsV2Command).resolves({
                Contents: [
                    { Key: 'testPath/' },
                    { Key: 'testPath/test1.csv' },
                    { Key: 'test2.csv' },
                ],
                IsTruncated: false,
                NextContinuationToken: undefined,
            });
        });
        afterEach(() => {
            s3Mock.reset();
        });
        it('NextContinuationToken is undefined', async () => {
            await listObjects(new S3Client({}), 'bucket', 'path');
            expect(s3Mock.commandCalls(ListObjectsV2Command)[0].args[0].input).toEqual({
                Bucket: 'bucket',
                Prefix: 'path',
            });
        });
        it('have NextContinuationToken', async () => {
            s3Mock.reset();
            s3Mock
                .on(ListObjectsV2Command)
                .resolvesOnce({
                    Contents: [{ Key: 'test1' }, { Key: 'test2' }],
                    IsTruncated: true,
                    NextContinuationToken: 'token',
                })
                .resolvesOnce({
                    Contents: [{ Key: 'test3' }, { Key: 'test4' }],
                    IsTruncated: false,
                    NextContinuationToken: undefined,
                });

            await listObjects(new S3Client({}), 'bucket', 'path');
            expect(s3Mock).toReceiveCommandTimes(ListObjectsV2Command, 2);
            expect(s3Mock.commandCalls(ListObjectsV2Command)[0].args[0].input).toEqual({
                Bucket: 'bucket',
                Prefix: 'path',
            });
            expect(s3Mock.commandCalls(ListObjectsV2Command)[1].args[0].input).toEqual({
                Bucket: 'bucket',
                Prefix: 'path',
                ContinuationToken: 'token',
            });
        });
        it('returns the expected value', async () => {
            expect(await listObjects(new S3Client({}), 'bucket', 'path')).toEqual([
                'test1.csv',
                'test2.csv',
            ]);
        });
        it('throws error when Contents is empty', async () => {
            s3Mock.reset();
            s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });
            await expect(() =>
                listObjects(new S3Client({}), 'bucket', 'path'),
            ).rejects.toThrowError('Contents is undefined');
        });
        it('throws error when Contents.Key is empty', async () => {
            s3Mock.reset();
            s3Mock
                .on(ListObjectsV2Command)
                .resolves({ Contents: [{ Key: 'testPath/test1.csv' }, {}] });
            await expect(() =>
                listObjects(new S3Client({}), 'bucket', 'path'),
            ).rejects.toThrowError('Content Key is undefined');
        });
    });
    describe('getObjectStream', () => {
        const stream = new Readable();
        stream.push('hello world');
        stream.push(null);
        const sdkStream = sdkStreamMixin(stream);

        beforeEach(() => {
            s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
        });
        afterEach(() => {
            s3Mock.reset();
        });
        it('file directly below bucket', async () => {
            await getObjectStream(new S3Client({}), 'bucket', '', 'test.csv');
            expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
                Bucket: 'bucket',
                Key: 'test.csv',
            });
        });
        it('correctly sets the parameters when calling getObject by path', async () => {
            await getObjectStream(new S3Client({}), 'bucket', 'path', 'test.csv');
            expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
                Bucket: 'bucket',
                Key: 'path/test.csv',
            });
        });
        it('correctly sets the parameters when calling getObject by empty path', async () => {
            await getObjectStream(new S3Client({}), 'bucket', '', 'test.csv');
            expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
                Bucket: 'bucket',
                Key: 'test.csv',
            });
        });
        it('returns the expected value', async () => {
            expect(await getObjectStream(new S3Client({}), 'bucket', 'path', 'test.csv')).toEqual(
                sdkStream,
            );
        });
        it('throws error when response.Body is empty', async () => {
            s3Mock.reset();
            s3Mock.on(GetObjectCommand).resolves({});
            await expect(() =>
                getObjectStream(new S3Client({}), 'bucket', 'path', 'test.csv'),
            ).rejects.toThrowError('Body is undefined');
        });
    });
    describe('uploadObject', () => {
        const stream = new Readable();
        stream.push('hello world');
        stream.push(null);
        const sdkStream = sdkStreamMixin(stream);

        it('file directly below bucket', async () => {
            await uploadObject(new S3Client({}), 'bucket', '', 'test.zip', sdkStream);
            expect(mocks.mockUpload).toHaveBeenCalledWith({
                client: expect.any(S3Client),
                params: {
                    Bucket: 'bucket',
                    Key: 'test.zip',
                    Body: expect.any(Object),
                },
            });
        });
        it('file directly have path', async () => {
            await uploadObject(new S3Client({}), 'bucket', 'path', 'test.zip', sdkStream);
            expect(mocks.mockUpload).toHaveBeenCalledWith({
                client: expect.any(S3Client),
                params: {
                    Bucket: 'bucket',
                    Key: 'path/test.zip',
                    Body: expect.any(Object),
                },
            });
        });
    });
    describe('consoleLog', () => {
        const spyLog = vi.spyOn(console, 'log');
        const stream = new Readable();
        stream.push('hello world');
        stream.push(null);
        const sdkStream = sdkStreamMixin(stream);

        beforeEach(() => {
            s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
            spyLog.mockReset();
        });
        afterAll(() => {
            spyLog.mockRestore();
        });
        it('does not log when debugFlag is false', async () => {
            await getObjectStream(new S3Client({}), 'bucket', '', 'test.csv', false);
            expect(spyLog).not.toHaveBeenCalled();
        });
        it('logs when debugFlag is true', async () => {
            await getObjectStream(new S3Client({}), 'bucket', '', 'test.csv', true);
            expect(spyLog).toHaveBeenCalled();
        });
    });
});
