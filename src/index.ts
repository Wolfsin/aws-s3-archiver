import { PassThrough, Readable } from 'stream';
import { S3Client } from '@aws-sdk/client-s3';
import { getObjectStream, listObjects, uploadObject } from './s3Wrapper';
import archiver from 'archiver';

/**
 * Archives files from an AWS S3 bucket with stream and stores the zip file in S3.
 *
 * @param {string} sourceBucket - The name of the source S3 bucket.
 * @param {string} sourcePath - The path in the source bucket where the files to be archived are located.
 * @param {string[]} sourceFileList - An array of file names to be archived. If empty, all files in the source will be archived.
 * @param {string} targetBucket - The name of the target S3 bucket where the zip file will be stored. Defaults to the source bucket.
 * @param {string} targetPath - The path in the target bucket where the zip file will be stored. Defaults to the source path.
 * @param {string} targetFileName - The name of the zip file. Defaults to 'archive'.
 * @param {object} s3ClientOptions - Options for the S3 client. Defaults to an empty object.
 * @param {object} zipOptions - Options for the archiver. Defaults to an empty object.
 * @returns {Promise<void>} A promise that resolves when the zip file has been created and stored in S3.
 * @example s3Zip('sourceBucket', 'sourcePath', ['file1.txt', 'file2.txt'], 'targetBucket', 'targetPath', 'archive',{region: 'ap-northeast-1'},{zlib: { level: 0 }});
 */
export const s3Zip = async (
    sourceBucket: string,
    sourcePath: string,
    sourceFileList: string[] = [],
    targetBucket: string = sourceBucket,
    targetPath: string = sourcePath,
    targetFileName: string = 'archive',
    s3ClientOptions: object = {},
    zipOptions: object = {},
): Promise<void> => {
    const streamArchiver = archiver('zip', zipOptions);
    const outputStream = new PassThrough();
    const client = new S3Client(s3ClientOptions);

    if (sourceFileList.length === 0) {
        const listObjectResult = await listObjects(client, sourceBucket, sourcePath);
        sourceFileList = [...listObjectResult];
    }

    const fileStreamList = await Promise.all(
        sourceFileList.map((fileName) =>
            getObjectStream(client, sourceBucket, sourcePath, fileName),
        ),
    );
    fileStreamList.forEach((fileStream) => {
        const name = sourceFileList[fileStreamList.indexOf(fileStream)];
        streamArchiver.append(fileStream as Readable, { name });
    });
    await streamArchiver.finalize();

    await uploadObject(client, targetBucket, targetPath, targetFileName, outputStream);
};
