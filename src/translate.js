const AWS = require("aws-sdk");

const awsRegion = process.env.AWS_REGION || "us-east-1";
const sourceLanguage = process.env.SOURCE_LANGUAGE
const targetLanguage = process.env.TARGET_LANGUAGE
const pollyVoiceId = process.env.POLLY_VOICE
const pollyLanguageCode = process.env.POLLY_LANGUAGE

const options = { region: awsRegion };

const translate = new AWS.Translate(options);
const s3 = new AWS.S3(options);
const polly = new AWS.Polly(options);

exports.lambdaHandler = async (event, context) => {
  
  try {
    let object = event.Records[0].s3.object.key;
    const from = object.split("/")[0]
    object = object.split("/").pop();
    const bucketName = event.Records[0].s3.bucket.name;
    
    console.log(`***TRANSLATE from ${from} (audio)***`)

    const converted = await s3.getObject({
      Bucket: bucketName,
      Key: `${from}/${object}`,
    }).promise();

    const convertedContent = JSON.parse(converted.Body.toString())
    const contenteTranslated = await translate.translateText({
      SourceLanguageCode: sourceLanguage, 
      TargetLanguageCode: targetLanguage, 
      Text: convertedContent.results.transcripts[0].transcript,
    }).promise();

    if (contenteTranslated.TranslatedText){
      await polly.startSpeechSynthesisTask({
        OutputFormat: 'mp3', 
        OutputS3BucketName: bucketName,
        OutputS3KeyPrefix: `${from}/`,
        Text: contenteTranslated.TranslatedText,
        LanguageCode: pollyLanguageCode,
        VoiceId: pollyVoiceId
      }).promise();
    } else {
      throw new Error("Text is empty")
    }
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