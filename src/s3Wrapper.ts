import {
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
    AbortMultipartUploadCommandOutput,
    CompleteMultipartUploadCommandOutput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

const consoleLog = (message: string, object: unknown) => {
    console.log(message);
    console.log(object);
};

export const listObjects = async (
    client: S3Client,
    bucket: string,
    path: string,
): Promise<string[]> => {
    let isTruncated = true;
    let contents: string[] = [];
    let ContinuationToken = undefined;

    while (isTruncated) {
        const command: ListObjectsV2Command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: path,
            ContinuationToken,
        });
        consoleLog('ListObjectsV2Command', command);
        const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);
        consoleLog('ListObjectsV2Command Contents', Contents);
        if (!Contents || Contents.length == 0) throw new Error('Contents is undefined');
        contents = contents.concat(
            Contents.map((content) => {
                if (!content.Key) throw new Error('Content Key is undefined');
                return content.Key.substring(content.Key.lastIndexOf('/') + 1);
            }),
        );
        isTruncated = IsTruncated ? IsTruncated : false;
        ContinuationToken = NextContinuationToken;
    }
    return contents.filter((item) => item !== '');
};

export const getObjectStream = async (
    client: S3Client,
    bucket: string,
    path: string,
    fileName: string,
): Promise<Readable | ReadableStream | Blob> => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: path.length === 0 ? fileName : `${path}/${fileName}`,
    });
    consoleLog('GetObjectCommand', command);
    const response = await client.send(command);
    if (!response.Body) throw new Error('Body is undefined');
    return response.Body;
};

export const uploadObject = async (
    client: S3Client,
    bucket: string,
    path: string,
    fileName: string,
    body: Readable | ReadableStream | Blob | string,
): Promise<AbortMultipartUploadCommandOutput | CompleteMultipartUploadCommandOutput> => {
    const parallelUploads3 = new Upload({
        client,
        params: {
            Bucket: bucket,
            Key: path.length === 0 ? `${fileName}.zip` : `${path}/${fileName}.zip`,
            Body: body,
        },
    });
    const response = await parallelUploads3.done();
    return response;
};
