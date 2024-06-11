import { fetchAWSS3Client } from '../../services/utilities/src'

const createBuckets = async () => {
  const createBucket = (s3: AWS.S3, bucketParams: any) => {
    s3.createBucket(bucketParams, function (err, data) {
      if (err) {
        console.log('Error', err)
      } else {
        console.log('Bucket Created Successfully', data.Location)
      }
    })
  }

  const createBucketIfNotExists = (
    s3: AWS.S3,
    bucketName: string,
    bucketParams: any
  ) => {
    s3.headBucket({ Bucket: bucketName }, function (err, data) {
      if (err && err.code === 'NotFound') {
        console.log('Bucket not found, creating it...')
        createBucket(s3, bucketParams)
      } else if (err) {
        console.log('Error', err)
      } else {
        console.log('Bucket exists, proceeding with operations...')
      }
    })
  }

  if (process.env.LOCAL_S3 === 'true') {
    const s3 = await fetchAWSS3Client()
    const deploymentConfigBucket = {
      Bucket: 'sphinx-compiler-configs',
      CreateBucketConfiguration: {
        LocationConstraint: 'us-east-1',
      },
    }
    createBucketIfNotExists(
      s3,
      'sphinx-compiler-configs',
      deploymentConfigBucket
    )

    const artifactBucket = {
      Bucket: 'sphinx-artifacts',
      CreateBucketConfiguration: {
        LocationConstraint: 'us-east-1',
      },
    }
    createBucketIfNotExists(s3, 'sphinx-artifacts', artifactBucket)
  }
}

createBuckets()
