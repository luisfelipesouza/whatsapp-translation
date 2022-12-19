const AWS = require("aws-sdk");
const awsRegion = process.env.AWS_REGION || "us-east-1";

const options = { region: awsRegion };
const secretManager = new AWS.SecretsManager(options);

exports.getSecretsWhatsapp = async (vaultName) => {
  try {
    let result = {}
    result = await secretManager.getSecretValue({ SecretId: vaultName }).promise();
    return result;
  } catch (err) {
    console.error(err);
  }
};