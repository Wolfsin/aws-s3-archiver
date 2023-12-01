# AWS S3 Archiver

## Introduction

Based on [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) and [archiver](https://github.com/archiverjs/node-archiver), use **stream** to archive files in the AWS S3 storage bucket and generate a zip file to store it back in S3. 

Developed and full support for TypeScript. Supports ES Modules and CommonJS.

## Installation

```
npm i 
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
 * @returns {Promise<object>} A promise that resolves with s3Upload Response when the zip file has been created and stored in S3.
 */
```

## Usage

1. **Minimal** - With the minimum number of parameters, it will archive all files in the provided bucket/path and generate a file named 'archive.zip' in the same directory.

```typescript
import {s3Zip} from ''

const result = await s3Zip('sourceBucket', 'sourcePath')
console.log(result);
```

2. Archive all files in the provided bucket/path and generate a zip file with the given name in the same directory.

```typescript
import {s3Zip} from ''

const result = await s3Zip('sourceBucket', 'sourcePath', 'targetFileName')
console.log(result);
```

3. Archive specified list of files in the the provided bucket/path.

```typescript
import {s3Zip} from ''

const result = await s3Zip('sourceBucket', 'sourcePath', 'targetFileName', ['file1.txt', 'file2.pdf'])
console.log(result);
```

4. Archive all files in the provided bucket/path and generate zip file with the given bucket/path.

```typescript
import {s3Zip} from ''

const result = await s3Zip('sourceBucket', 'sourcePath', 'targetFileName', [], 'targetBucket', 'targetPath')
console.log(result);
```

5. Customize S3Client and compression attributes.

S3Client Options: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ - index for S3Client Configuration 

ZIP Options: https://www.archiverjs.com/docs/archiver#zip-options

```typescript
import {s3Zip} from ''

const result = await s3Zip('sourceBucket', 'sourcePath', 'archive', [], 'targetBucket', 'targetPath', { region: 'us-east-1' }, { zlib: { level: 9 } })
console.log(result);
```

## Test

```
npm run test
```

## Coverage

```
npm run coverage
```

> Coverage report from v8
> | File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
> | ------------ | ------- | -------- | ------- | ------- | ----------------- |
> | All files    | 100     | 100      | 100     | 100     |                   |
> | index.ts     | 100     | 100      | 100     | 100     |                   |
> | s3Wrapper.ts | 100     | 100      | 100     | 100     |                   |

## Releases / Changelogs

1.0.0 - Initial stable release
