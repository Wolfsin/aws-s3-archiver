import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const listObjects = async (
    client: S3Client,
    bucket: string,
    path: string,
): Promise<string[]> => {
    const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: path,
    });
    let isTruncated = true;
    let contents: string[] = [];
    while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);
        if (!Contents) throw new Error('Contents is undefined');
        contents = contents.concat(
            Contents.map((content) => {
                if (!content.Key) throw new Error('content Key is undefined');
                return content.Key.substring(content.Key.lastIndexOf('/') + 1);
            }),
        );
        isTruncated = IsTruncated ? IsTruncated : false;
        command.input.ContinuationToken = NextContinuationToken;
    }
    return contents;
};
