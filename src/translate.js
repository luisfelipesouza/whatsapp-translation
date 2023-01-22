const AWS = require("aws-sdk");
const database = require("./util/database");
const setup = require("./util/setup");
const whatsapp = require("./util/whatsapp");
const secrets = require("./util/secrets");

const awsRegion = process.env.AWS_REGION || "us-east-1";
const vault = process.env.VAULT;

const options = { region: awsRegion };

const translate = new AWS.Translate(options);
const s3 = new AWS.S3(options);
const polly = new AWS.Polly(options);

function isEmpty(object) {
  return Object.keys(object).length === 0;
}

exports.lambdaHandler = async (event, context) => {
  try {
    let object = event.Records[0].s3.object.key;
    const bucketName = event.Records[0].s3.bucket.name;
    const from = object.split("/")[0];
    object = object.split("/").pop();

    const secretsWhatsapp = await secrets.getSecretsWhatsapp(vault);
    const { token, phoneNumberId } = JSON.parse(secretsWhatsapp.SecretString);
    const whatsappOptions = {
      token: token,
      phoneNumberId: phoneNumberId,
    };

    const tableData = await database.readItem(from);
    const language = tableData.Item.LangTranslation;
    const translation = tableData.Item.TranslationCode;
    const translationMap = setup.translateConfig(language, translation);

    console.log(translationMap);

    console.log(`***TRANSLATE from ${from} (audio)***`);

    const converted = await s3
      .getObject({
        Bucket: bucketName,
        Key: `${from}/${object}`,
      })
      .promise();

    console.log(converted);

    const convertedContent = JSON.parse(converted.Body.toString());
    const contentTranslated = await translate
      .translateText({
        SourceLanguageCode: translationMap.sourceLanguage,
        TargetLanguageCode: translationMap.targetLanguage,
        Text: convertedContent.results.transcripts[0].transcript,
      })
      .promise();

    console.log(contentTranslated);

    if (isEmpty(contentTranslated)) {
      await whatsapp.sendMessage({
        ...whatsappOptions,
        message: "Não foi possível interpretar seu audio!",
        sendTo: from,
      });

      return {
        statusCode: 200,
      };
    }

    if (contentTranslated.TranslatedText) {
      await polly
        .startSpeechSynthesisTask({
          OutputFormat: "mp3",
          OutputS3BucketName: bucketName,
          OutputS3KeyPrefix: `${from}/`,
          Text: contentTranslated.TranslatedText,
          LanguageCode: translationMap.pollyLanguage,
          VoiceId: translationMap.pollyVoice,
        })
        .promise();
    } else {
      throw new Error("Text is empty");
    }
  } catch (ex) {
    console.error("Error", ex);
    return {
      statusCode: ex.statusCode ? ex.statusCode : 500,
      body: JSON.stringify(
        {
          error: ex.name ? ex.name : "Exception",
          message: ex.message ? ex.message : "Unknown error",
          stack: ex.stack ? ex.stack : "Unknown trace",
        },
        null,
        2
      ),
    };
  }

  return {
    statusCode: 200,
  };
};
