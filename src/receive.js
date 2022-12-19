const AWS = require("aws-sdk");
const axios = require("axios");
const secrets = require("./util/secrets");

const awsRegion = process.env.AWS_REGION || "us-east-1";
const vault = process.env.VAULT
const facebookUrl = process.env.FACEBOOK_URL;
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const sourceLanguage = process.env.SOURCE_LANGUAGE
const targetLanguage = process.env.TARGET_LANGUAGE

const options = { region: awsRegion };
const s3 = new AWS.S3(options);
const translate = new AWS.Translate(options);

exports.lambdaHandler = async (event, context) => {
   
  try {
    const body = JSON.parse(event.body);
    const secretsWhatsapp = await secrets.getSecretsWhatsapp(vault);
    const { token, phoneNumberId } = JSON.parse(secretsWhatsapp.SecretString);
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

            console.log(`***RECEIVE from ${from} (${type})***`)

            await axios({
              method: "POST",
              url:`${facebookUrl}/${phoneNumberId}/messages/`,
              data: {
                messaging_product: "whatsapp",
                status: "read",
                message_id: body.entry[0].changes[0].value.messages[0].id
              },
              headers: {
                'Authorization': `Bearer ${token}` 
              },
            });

            if (type == "text") {
              responseBody = body.entry[0].changes[0].value.messages[0].text.body;

              console.log(`***TRANSLATE from ${from} (${type})***`)

              const contenteTranslated = await translate.translateText({
                SourceLanguageCode: sourceLanguage, 
                TargetLanguageCode: targetLanguage, 
                Text: responseBody,
              }).promise();
              
              console.log(`***RESPONSE from ${from} (${type})***`)

              await axios({
                method: "POST",
                url: `${facebookUrl}/${phoneNumberId}/messages/`,
                data: {
                    messaging_product: "whatsapp",
                    to: from,
                    text: { body: contenteTranslated.TranslatedText },
                },
                headers: {
                  'Authorization': `Bearer ${token}` 
                },
              });
            
            }

            if (type == "audio") {
              let audio_id = body.entry[0].changes[0].value.messages[0].audio.id // extract the message text from the webhook payload
              responseBody = body.entry[0].changes[0].value.messages[0].audio.body;

              const audio_url = await axios({
                method: "GET",
                timeout: 10000,
                headers: {
                  'Authorization': `Bearer ${token}` 
                },
                url: `${facebookUrl}/${audio_id}`
              });

              const audio_file = await axios({
                method: "GET",
                timeout: 10000,
                responseType: "arraybuffer",
                headers: {
                  'Authorization': `Bearer ${token}` 
                },
                url: audio_url.data.url
              });

              await s3.upload({
                Bucket: bucketName,
                Key: `${from}/${audio_id}.ogg`,
                Body: audio_file.data,
              }).promise()

            }
        }
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