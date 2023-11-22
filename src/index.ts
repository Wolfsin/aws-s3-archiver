import { S3Client } from '@aws-sdk/client-s3';
import { listObjects } from './s3Wrapper';

export const s3Zip = async (
    sourceBucket: string,
    sourcePath: string,
    sourceFileList: string[] = [],
    targetBucket: string = sourceBucket,
    targetPath: string = sourcePath,
    targetFileName: string = 'archive.zip',
    zipOptions: object = {},
) => {
    const client = new S3Client({});
    if (sourceFileList.length === 0) {
        const listObjectResult = await listObjects(client, sourceBucket, sourcePath);
        sourceFileList = [...listObjectResult];
    }
};
