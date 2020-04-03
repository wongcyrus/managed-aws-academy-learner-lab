const AWS = require('aws-sdk');
const studentAccountTable = process.env.StudentAccountTable;
const dynamo = new AWS.DynamoDB.DocumentClient();
const common = require('/opt/common');

const createStudentLabStack = async(param) => {
    const { roleArn, templateBody, parameters, stackName, labStackCreationCompleteTopic } = param;
    const sts = new AWS.STS();
    const token = await sts.assumeRole({
        RoleArn: roleArn,
        RoleSessionName: 'studentAccount'
    }).promise();

    const cloudformation = new AWS.CloudFormation({
        accessKeyId: token.Credentials.AccessKeyId,
        secretAccessKey: token.Credentials.SecretAccessKey,
        sessionToken: token.Credentials.SessionToken,
        region: "us-east-1"
    });
    const params = {
        StackName: stackName,
        NotificationARNs: [labStackCreationCompleteTopic],
        Capabilities: [
            "CAPABILITY_IAM", "CAPABILITY_NAMED_IAM",
        ],
        Parameters: parameters,
        TemplateBody: templateBody
    };
    let response = await cloudformation.createStack(params).promise();
    console.log(response);
};

exports.lambdaHandler = async(event, context) => {
    console.log(event);
    let { classroomNumber, stackName, email, bucket, templateKey, parametersKey } = event;

    let studentAccount = await dynamo.get({
        TableName: studentAccountTable,
        Key: {
            'classroomNumber': classroomNumber,
            'email': email
        }
    }).promise();
    console.log(studentAccount);

    let keyPair = JSON.parse(studentAccount.Item.keyPair);

    let parametersString = await common.getS3File(bucket, parametersKey);
    console.log(parametersString);
    let parameters = JSON.parse(parametersString);

    const replaceValue = (key, value) => {
        let index = parameters.map(c => c.ParameterValue).indexOf(key);
        if (index != -1) {
            parameters[index].ParameterValue = value;
        }
    };

    replaceValue("###studentAccountArn###", studentAccount.Item.studentAccountArn);
    replaceValue("###keyPairName###", classroomNumber + "-" + email);
    replaceValue("###KeyMaterial###", keyPair.KeyMaterial);
    console.log(parameters);

    const param = {
        stackName,
        labStackCreationCompleteTopic: studentAccount.Item.labStackCreationCompleteTopic,
        roleArn: `arn:aws:iam::${studentAccount.Item.awsAccountId}:role/crossaccountteacher`,
        templateBody: await common.getS3File(bucket, templateKey),
        parameters: parameters
    };
    await createStudentLabStack(param);
    return "OK";
};
