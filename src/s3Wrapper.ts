import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

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
        const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);
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
    return contents;
};

export const getObject = async (
    client: S3Client,
    bucket: string,
    path: string,
    fileName: string,
): Promise<Readable | ReadableStream | Blob> => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: path.length === 0 ? fileName : `${path}/${fileName}`,
    });
    const response = await client.send(command);
    if (!response.Body) throw new Error('Body is undefined');
    return response.Body;
};
