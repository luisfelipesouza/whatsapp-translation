const AWS = require("aws-sdk");
const axios = require("axios");
const secrets = require("./util/secrets");

const awsRegion = process.env.AWS_REGION || "us-east-1";
const vault = process.env.VAULT
const facebookUrl = process.env.FACEBOOK_URL;

const options = { region: awsRegion };
const s3 = new AWS.S3(options);

exports.lambdaHandler = async (event, context) => {
   
  try {

    let object = event.Records[0].s3.object.key;
    const from = object.split("/")[0]
    console.log(`***RESPONSE from ${from} (audio)***`)
    const bucketName = event.Records[0].s3.bucket.name;

    const secretsWhatsapp = await secrets.getSecretsWhatsapp(vault);
    const { token, phoneNumberId } = JSON.parse(secretsWhatsapp.SecretString);

    const url = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: object,
      Expires: 300
    });

    await axios({
      method: "POST",
      timeout: 10000,
      url: `${facebookUrl}/${phoneNumberId}/messages`,
      data: {
          messaging_product: "whatsapp",
          to: from,
          type: "audio",
          audio: { link: url}, 
      },
      headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}`  },
    });

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