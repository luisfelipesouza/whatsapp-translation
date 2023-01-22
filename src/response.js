const AWS = require("aws-sdk");
const secrets = require("./util/secrets");
const whatsapp = require("./util/whatsapp");

const awsRegion = process.env.AWS_REGION || "us-east-1";
const vault = process.env.VAULT;

const options = { region: awsRegion };

const s3 = new AWS.S3(options);

exports.lambdaHandler = async (event, context) => {
  try {
    let object = event.Records[0].s3.object.key;
    const from = object.split("/")[0];
    const bucketName = event.Records[0].s3.bucket.name;

    console.log(`***RESPONSE from ${from} (audio)***`);

    const secretsWhatsapp = await secrets.getSecretsWhatsapp(vault);
    const { token, phoneNumberId } = JSON.parse(secretsWhatsapp.SecretString);
    const whatsappOptions = {
      token: token,
      phoneNumberId: phoneNumberId,
    };

    const url = s3.getSignedUrl("getObject", {
      Bucket: bucketName,
      Key: object,
      Expires: 300,
    });

    await whatsapp.sendAudio({
      ...whatsappOptions,
      audioUrl: url,
      sendTo: from,
    });
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
