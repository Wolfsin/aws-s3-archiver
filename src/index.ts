import { PassThrough, Readable } from 'stream';
import { S3Client } from '@aws-sdk/client-s3';
import { getObject, listObjects } from './s3Wrapper';
import archiver from 'archiver';

export const s3Zip = async (
    sourceBucket: string,
    sourcePath: string,
    sourceFileList: string[] = [],
    targetBucket: string = sourceBucket,
    targetPath: string = sourcePath,
    targetFileName: string = 'archive.zip',
    zipOptions: object = {},
    s3ClientOptions: object = {},
) => {
    const streamArchiver = archiver('zip', zipOptions);
    const outputStream = new PassThrough();
    const client = new S3Client(s3ClientOptions);

    if (sourceFileList.length === 0) {
        const listObjectResult = await listObjects(client, sourceBucket, sourcePath);
        sourceFileList = [...listObjectResult];
    }

    const fileStreamList = await Promise.all(
        sourceFileList.map((fileName) => getObject(client, sourceBucket, sourcePath, fileName)),
    );
    fileStreamList.forEach((fileStream) => {
        const name = sourceFileList[fileStreamList.indexOf(fileStream)];
        streamArchiver.append(fileStream as Readable, { name });
    });
    await streamArchiver.finalize();
};
