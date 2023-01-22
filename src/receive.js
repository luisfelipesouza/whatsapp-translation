const AWS = require("aws-sdk");
const secrets = require("./util/secrets");
const setup = require("./util/setup");
const whatsapp = require("./util/whatsapp");
const database = require("./util/database");

const awsRegion = process.env.AWS_REGION || "us-east-1";
const vault = process.env.VAULT;
const bucketName = process.env.AWS_S3_BUCKET_NAME;

const options = { region: awsRegion };

const s3 = new AWS.S3(options);
const translate = new AWS.Translate(options);

function isEmpty(object) {
  return Object.keys(object).length === 0;
}

exports.lambdaHandler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const secretsWhatsapp = await secrets.getSecretsWhatsapp(vault);
    const { token, phoneNumberId } = JSON.parse(secretsWhatsapp.SecretString);
    const whatsappOptions = {
      token: token,
      phoneNumberId: phoneNumberId,
    };

    if (body.entry) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        let from = body.entry[0].changes[0].value.messages[0].from;
        let type = body.entry[0].changes[0].value.messages[0].type;
        let messageId = body.entry[0].changes[0].value.messages[0].id;

        if (type === "unsupported") {
          return {
            statusCode: 200,
          };
        }

        console.log(`***RECEIVE from ${from} (${type})***`);

        await whatsapp.readMessage({
          ...whatsappOptions,
          messageId: messageId,
        });

        const tableData = await database.readItem(from);

        let language = "english";
        let translateCode = "en-pt";

        if (isEmpty(tableData)) {
          await whatsapp.sendMessage({
            ...whatsappOptions,
            message:
              "Bem-vindo ao tradutor. \n" +
              "Como é sua primeira vez, por favor, defina a linguagem.",
            sendTo: from,
          });

          await setup.setupLanguage("!setup", language, {
            ...whatsappOptions,
            sendTo: from,
          });

          await database.createItem({
            key: from,
            language: language,
            translate: translateCode,
          });

          return {
            statusCode: 200,
          };
        } else {
          language = tableData.Item.LangTranslation;
          translateCode = tableData.Item.TranslationCode;
        }

        const languageMap = setup.translateConfig(language, translateCode);

        if (type == "interactive") {
          let interactiveType =
            body.entry[0].changes[0].value.messages[0].interactive.type;
          let messageId =
            body.entry[0].changes[0].value.messages[0].interactive[
              interactiveType
            ].id;

          await setup.setupLanguage(messageId, language, {
            ...whatsappOptions,
            sendTo: from,
          });

          return {
            statusCode: 200,
          };
        }

        if (type == "text") {
          let message = body.entry[0].changes[0].value.messages[0].text.body;
          console.log(`***TRANSLATE from ${from} (${type})***`);

          if (message.substring(0, 1) === "!") {
            await setup.setupLanguage(message, language, {
              ...whatsappOptions,
              sendTo: from,
            });

            return {
              statusCode: 200,
            };
          }

          const contenteTranslated = await translate
            .translateText({
              SourceLanguageCode: languageMap.sourceLanguage,
              TargetLanguageCode: languageMap.targetLanguage,
              Text: message,
            })
            .promise();

          console.log(`***RESPONSE from ${from} (${type})***`);

          await whatsapp.sendMessage({
            ...whatsappOptions,
            message: contenteTranslated.TranslatedText,
            sendTo: from,
          });
        }

        if (type == "audio") {
          let audioId = body.entry[0].changes[0].value.messages[0].audio.id; // extract the message text from the webhook payload
          responseBody = body.entry[0].changes[0].value.messages[0].audio.body;

          const audioUrl = await whatsapp.getAudioUrl({
            ...whatsappOptions,
            audioId: audioId,
          });

          const audioFile = await whatsapp.getAudioFile({
            ...whatsappOptions,
            audioUrl: audioUrl,
          });

          await s3
            .upload({
              Bucket: bucketName,
              Key: `${from}/${audioId}.ogg`,
              Body: audioFile,
              Metadata: {
                language: language,
                translation: translateCode,
                "phone-number": from,
              },
            })
            .promise();
        }
      }
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
