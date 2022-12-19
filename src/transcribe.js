const AWS = require("aws-sdk");

const awsRegion = process.env.AWS_REGION || "us-east-1";

const options = { region: awsRegion };
const transcribeService = new AWS.TranscribeService(options);

exports.lambdaHandler = async (event, context) => {
   
  try {
    
    let object = event.Records[0].s3.object.key;
    const from = object.split("/")[0]
    object = object.split("/").pop();

    console.log(`***TRANSCRIBE from ${from} (audio)***`)

    const bucketName = event.Records[0].s3.bucket.name;

    await transcribeService.startTranscriptionJob({
      TranscriptionJobName: object.split(".")[0],
      LanguageCode: "pt-BR",
      MediaFormat: "ogg",
      Media: {
        MediaFileUri: `s3://${bucketName}/${from}/${object}`,
      },
      OutputBucketName: bucketName,
      OutputKey: `${from}/`
    }).promise();

  } catch (ex){
    console.error("Error", ex);
      return {
          statusCode: ex.statusCode ? ex.statusCode : 500,
          body: JSON.stringify({
              error: ex.name ? ex.name : "Exception",
              message: ex.message ? ex.message : "Unknown error",
              stack: ex.stack ? ex.stack : "Unknown trace",
          }, null, 2)
      }
    }

    return {
      statusCode: 200,
    };
  }