const AWS = require("aws-sdk");

const awsRegion = process.env.AWS_REGION || "us-east-1";
const tableName = process.env.TABLE_NAME;
const options = { region: awsRegion };

const dynamoDb = new AWS.DynamoDB.DocumentClient(options);

exports.readItem = async (key) => {
    return await dynamoDb.get({
        TableName: tableName,
        Key: {
            phoneNumber: key
        }
    }).promise();
}

exports.createItem = async (item) => {
    const timestamp = new Date().toISOString()
    return await dynamoDb.put({
        TableName: tableName,
        Item: {
            phoneNumber: item.key,
            LangTranslation: item.language,
            TranslationCode: item.translate,
            CreatedAt: timestamp,
            UpdatedAt: timestamp
        }
    }).promise();
}

exports.updateItem = async (item) => {
    const timestamp = new Date().toISOString()
    return await dynamoDb.update({
        TableName: tableName,
        Key: {
            phoneNumber: item.key,
        },
        UpdateExpression:
            "SET LangTranslation = :LangTranslation, UpdatedAt = :UpdatedAt" ,
        ConditionExpression: "attribute_exists(phoneNumber)",
        ExpressionAttributeValues: {
            ":LangTranslation": item.language,
            ":UpdatedAt": timestamp
        }
    }).promise();
}

exports.updateTranslate = async (item) => {
    const timestamp = new Date().toISOString()
    return await dynamoDb.update({
        TableName: tableName,
        Key: {
            phoneNumber: item.key,
        },
        UpdateExpression:
            "SET TranslationCode = :TranslationCode, UpdatedAt = :UpdatedAt" ,
        ConditionExpression: "attribute_exists(phoneNumber)",
        ExpressionAttributeValues: {
            ":TranslationCode": item.translate,
            ":UpdatedAt": timestamp
        }
    }).promise();
}