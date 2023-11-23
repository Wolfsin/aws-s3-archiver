import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { sdkStreamMixin } from '@smithy/util-stream';
import { Readable } from 'stream';
import { createReadStream } from 'fs';

import { describe, expect, it } from 'vitest';
import { listObjects } from '../src/s3Wrapper';

const s3Mock = mockClient(S3Client);
describe('s3Wrapper', () => {
    beforeEach(() => {
        s3Mock.on(ListObjectsV2Command).resolves({
            Contents: [{ Key: 'testPath/test1.csv' }, { Key: 'test2.csv' }],
            IsTruncated: false,
            NextContinuationToken: undefined,
        });
    });
    afterEach(() => {
        s3Mock.reset();
    });

    describe('listObjects', () => {
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
});
