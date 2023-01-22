const AWS = require("aws-sdk");
const setup = require("./util/setup");
const database = require("./util/database");

const awsRegion = process.env.AWS_REGION || "us-east-1";

const options = { region: awsRegion };

const transcribeService = new AWS.TranscribeService(options);
const s3 = new AWS.S3(options);

exports.lambdaHandler = async (event, context) => {
   
  try {
    
    let object = event.Records[0].s3.object.key;
    const bucketName = event.Records[0].s3.bucket.name;
    const from = object.split("/")[0];
    object = object.split("/").pop();

    const tableData = await database.readItem(from);
    const language = tableData.Item.LangTranslation;
    const translation = tableData.Item.TranslationCode;
    const translationMap = setup.translateConfig(language, translation);

    console.log(`***TRANSCRIBE from ${from} (audio)***`)

    await transcribeService.startTranscriptionJob({
      TranscriptionJobName: object.split(".")[0],
      LanguageCode: translationMap.pollyLanguage,
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