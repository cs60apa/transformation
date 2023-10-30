const AWS = require('aws-sdk');

const s3Client = new AWS.S3({
    accessKeyId: "AKIASHP2FTSNP6EC4HKR",
    secretAccessKey: "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",
    region : 'eu-central-1'
});

const s3 = {};
s3.s3Client = s3Client;

export default s3;
