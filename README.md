# AWS S3 Archiver

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/) [![Node.js TEST](https://github.com/Wolfsin/aws-s3-archiver/actions/workflows/npm-test.yml/badge.svg?branch=main)](https://github.com/Wolfsin/aws-s3-archiver/actions/workflows/npm-test.yml) [![codecov](https://codecov.io/gh/Wolfsin/aws-s3-archiver/graph/badge.svg?token=2BA5F5JJRS)](https://codecov.io/gh/Wolfsin/aws-s3-archiver) [![npm version](https://badge.fury.io/js/aws-s3-archiver.svg)](https://badge.fury.io/js/aws-s3-archiver) ![NPM License](https://img.shields.io/npm/l/aws-s3-archiver)

## Introduction

Based on [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) and [archiver](https://github.com/archiverjs/node-archiver), use **stream** to archive files in the AWS S3 storage bucket and generate a zip file to store it back in S3.

Developed and full support for TypeScript. Supports ES Modules and CommonJS.

## Installation

```
npm i aws-s3-archiver
```

## Description

```typescript
/**
 * Archives files from an AWS S3 bucket with stream and stores the zip file in S3.
 *
 * @param {string} sourceBucket - The name of the source S3 bucket.
 * @param {string} sourcePath - The path in the source bucket where the files to be archived are located.
 * @param {string} targetFileName - The name of the zip file. Defaults to 'archive'.
 * @param {string[]} sourceFileList - An array of file names to be archived. If empty, all files in the source will be archived.
 * @param {string} targetBucket - The name of the target S3 bucket where the zip file will be stored. Defaults to the source bucket.
 * @param {string} targetPath - The path in the target bucket where the zip file will be stored. Defaults to the source path.
 * @param {object} s3ClientOptions - Options for the S3 client. Defaults to an empty object.
 * @param {object} zipOptions - Options for the archiver. Defaults to an empty object.
 * @param {boolean} debugFlag - Flag to enable debug logging. Defaults to false.
 * @returns {Promise<object>} A promise that resolves with s3Upload Response when the zip file has been created and stored in S3.
 */
```

## Usage

1. **Minimal** - With the minimum number of parameters, it will archive all files in the provided bucket/path and generate a file named 'archive.zip' in the same directory.

    ```typescript
    import { s3Zip } from 'aws-s3-archiver';

    const result = await s3Zip('sourceBucket', 'sourcePath');
    console.log(result);
    ```

2. Archive all files in the provided bucket/path and generate a zip file with the given name in the same directory.

    ```typescript
    import { s3Zip } from 'aws-s3-archiver';

    const result = await s3Zip('sourceBucket', 'sourcePath', 'targetFileName');
    console.log(result);
    ```

3. Archive specified list of files in the the provided bucket/path.

    ```typescript
    import { s3Zip } from 'aws-s3-archiver';

    const result = await s3Zip('sourceBucket', 'sourcePath', 'targetFileName', [
        'file1.txt',
        'file2.pdf',
    ]);
    console.log(result);
    ```

4. Archive all files in the provided bucket/path and generate zip file with the given bucket/path.

    ```typescript
    import { s3Zip } from 'aws-s3-archiver';

    const result = await s3Zip(
        'sourceBucket',
        'sourcePath',
        'targetFileName',
        [],
        'targetBucket',
        'targetPath',
    );
    console.log(result);
    ```

5. Customize S3Client and compression attributes.

    S3Client Options: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ - index for S3Client Configuration

    ZIP Options: https://www.archiverjs.com/docs/archiver#zip-options

    ```typescript
    import { s3Zip } from 'aws-s3-archiver';

    const result = await s3Zip(
        'sourceBucket',
        'sourcePath',
        'archive',
        [],
        'targetBucket',
        'targetPath',
        { region: 'us-east-1' },
        { zlib: { level: 9 } },
    );
    console.log(result);
    ```

6. If you need print out debug logs for aws sdk list/get command, set the debugFlag to true.

    ```typescript
    import { s3Zip } from 'aws-s3-archiver';

    const result = await s3Zip(
        'sourceBucket',
        'sourcePath',
        'archive',
        [],
        'targetBucket',
        'targetPath',
        { region: 'us-east-1' },
        { zlib: { level: 9 } },
        true,
    );
    console.log(result);
    ```

## Test

```
npm run test
```

## Releases / Changelogs

1.0.0 - Initial stable release

1.0.1 - Update README.md with Usage examples

1.0.2 - Add debugFlag to enable/disable aws sdk list/get command logging.

1.0.3 - Fixed a bug that allows an empty path.
