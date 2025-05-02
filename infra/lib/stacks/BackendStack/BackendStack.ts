import {
  EnhancedLambdaFunction,
  EventScheduleRule,
  LambdaTrigger
} from '@Lib/constructs';
import {
  ivsChatCreateTokensPolicy,
  ivsCreateResourcesPolicy,
  ivsDeleteResourcesPolicy,
  ivsGetResourcesPolicy,
  ivsPublicKeyPolicy,
  ivsTagResourcesPolicy,
  kmsGenerateDataKeyPairPolicy
} from '@Lib/policies';
import { Config } from '@Lib/types';
import {
  createExportName,
  createResourceName,
  getLambdaEntryPath
} from '@Lib/utils';
import { AppEnv } from '@Shared/types';
import {
  aws_apigateway as apigw,
  aws_appsync as appsync,
  aws_cognito as cognito,
  aws_dynamodb as ddb,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  aws_kms as kms,
  aws_lambda as lambda,
  aws_lambda_event_sources as eventSources,
  aws_logs as logs,
  aws_secretsmanager as sm,
  aws_sqs as sqs,
  aws_ssm as ssm,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'path';

import { calcVisibilityTimeout, createAppSyncUnitResolver } from './utils';

interface BackendStackProps extends StackProps {
  readonly appEnv: AppEnv;
  readonly config: Config;
}

class BackendStack extends Stack {
  readonly appEnv: AppEnv;

  readonly config: Config;

  readonly userPool: cognito.UserPool;

  readonly userPoolClient: cognito.UserPoolClient;

  readonly authorizer: apigw.CognitoUserPoolsAuthorizer;

  readonly messagesApi: appsync.GraphqlApi;

  readonly meetingsApi: apigw.RestApi;

  readonly meetingsTable: ddb.TableV2;

  readonly aliasIndexName = 'AliasIndex';

  readonly activeMeetingIndexName = 'ActiveMeetingsIndex';

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);
    this.appEnv = props.appEnv;
    this.config = props.config;

    const preSignUpLambda = new EnhancedLambdaFunction(this, 'PreSignUp', {
      entry: getLambdaEntryPath('triggers/preSignUp'),
      functionName: createResourceName(this, 'PreSignUp'),
      description: 'Validates, verifies and confirms user sign-ups.'
    });
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: createResourceName(this, 'UserPool'),
      autoVerify: {},
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      signInAliases: { preferredUsername: true, username: true, email: true },
      standardAttributes: { email: { required: true, mutable: false } },
      lambdaTriggers: { preSignUp: preSignUpLambda },
      removalPolicy: RemovalPolicy.DESTROY
    });
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: createResourceName(this, 'UserPoolClient'),
      authFlows: { userSrp: true },
      userPool: this.userPool
    });
    this.authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      authorizerName: createResourceName(this, 'Authorizer'),
      identitySource: apigw.IdentitySource.header('Authorization'),
      cognitoUserPools: [this.userPool]
    });

    preSignUpLambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'PreSignUpLambdaPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['cognito-idp:ListUsers'],
            resources: [this.userPool.userPoolArn]
          })
        ]
      })
    );
    if (this.config.allowedSignUpDomains) {
      preSignUpLambda.addEnvironment(
        'ALLOWED_SIGN_UP_DOMAINS',
        this.config.allowedSignUpDomains.toString()
      );
    }

    this.meetingsTable = new ddb.TableV2(this, 'MeetingsTable', {
      tableName: createResourceName(this, 'MeetingsTable'),
      partitionKey: { name: 'id', type: ddb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billing: ddb.Billing.onDemand(),
      globalSecondaryIndexes: [
        {
          indexName: this.aliasIndexName,
          partitionKey: { name: 'alias', type: ddb.AttributeType.STRING }
        },
        {
          indexName: this.activeMeetingIndexName,
          partitionKey: {
            name: 'activeSessionId',
            type: ddb.AttributeType.STRING
          },
          nonKeyAttributes: ['updatedAt', 'stageArn'],
          projectionType: ddb.ProjectionType.INCLUDE
        }
      ]
    });

    this.meetingsApi = new apigw.RestApi(this, 'MeetingsAPI', {
      restApiName: createResourceName(this, 'MeetingsAPI'),
      endpointExportName: createExportName(this, 'apiUrl'),
      deployOptions: { stageName: this.appEnv },
      defaultCorsPreflightOptions: {
        allowMethods: ['GET', 'POST'],
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowHeaders: apigw.Cors.DEFAULT_HEADERS
      }
    });

    this.messagesApi = new appsync.GraphqlApi(this, 'MessagesAPI', {
      name: createResourceName(this, 'MessagesAPI'),
      visibility: appsync.Visibility.GLOBAL,
      definition: appsync.Definition.fromFile(
        path.join(import.meta.dirname, 'graphql/schemas/messages.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: { userPool: this.userPool }
        }
      },
      xrayEnabled: true,
      logConfig: {
        excludeVerboseContent: false,
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_MONTH
      },
      introspectionConfig: this.isDev
        ? appsync.IntrospectionConfig.ENABLED
        : appsync.IntrospectionConfig.DISABLED
    });

    const noneDS = this.messagesApi.addNoneDataSource('NoneDataSource', {
      name: createResourceName(this, 'NoneDataSource'),
      description: 'Pass-through DataSource for generic pub/sub operations.'
    });
    createAppSyncUnitResolver({
      typeName: 'Mutation',
      fieldName: 'sendEvent',
      dataSource: noneDS
    });
    createAppSyncUnitResolver({
      typeName: 'Mutation',
      fieldName: 'sendNotif',
      dataSource: noneDS
    });
    createAppSyncUnitResolver({
      typeName: 'Subscription',
      fieldName: 'subscribeToMessages',
      dataSource: noneDS
    });

    const symmetricKey = new kms.Key(this, 'SymmetricEncryptionKey', {
      alias: createResourceName(this, 'SymmetricEncryptionKey'),
      enableKeyRotation: true,
      pendingWindow: Duration.days(7),
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: RemovalPolicy.DESTROY,
      description:
        'Symmetric encryption key used to rotate the ECDSA public/private key-pair used to create and verify stage participant tokens.'
    });

    const privateKeySecret = new sm.Secret(this, 'PrivateKey', {
      secretName: createResourceName(this, 'PrivateKey'),
      removalPolicy: RemovalPolicy.DESTROY,
      description:
        'Stores the PEM-formatted private key used to create stage participant tokens.'
    });

    const publicKeyArnParam = new ssm.StringParameter(this, 'PublicKeyArn', {
      tier: ssm.ParameterTier.STANDARD,
      dataType: ssm.ParameterDataType.TEXT,
      parameterName: `/${this.stackName}/publicKeyArn`,
      stringValue: JSON.stringify({ arn: '' }),
      description:
        'Stores the ARN of the imported public key used to verify stage participant tokens.'
    });

    const rotateKeyPairLambda = new EnhancedLambdaFunction(
      this,
      'RotateKeyPair',
      {
        environment: {
          ...this.commonEnv,
          SYMMETRIC_KEY_ARN: symmetricKey.keyArn,
          PRIVATE_KEY_SECRET_ARN: privateKeySecret.secretArn,
          PUBLIC_KEY_PREFIX: createResourceName(this, 'PublicKey'),
          PUBLIC_KEY_ARN_PARAM_NAME: publicKeyArnParam.parameterName
        },
        initialPolicy: [
          ivsPublicKeyPolicy,
          ivsTagResourcesPolicy,
          kmsGenerateDataKeyPairPolicy
        ],
        entry: getLambdaEntryPath('triggers/rotateKeyPair'),
        functionName: createResourceName(this, 'RotateKeyPair'),
        description:
          'Rotates the public-private key pair used to create and verify participant tokens'
      }
    );
    symmetricKey.grantDecrypt(rotateKeyPairLambda);
    privateKeySecret.grantRead(rotateKeyPairLambda);
    privateKeySecret.grantWrite(rotateKeyPairLambda);
    publicKeyArnParam.grantRead(rotateKeyPairLambda);
    publicKeyArnParam.grantWrite(rotateKeyPairLambda);

    // Trigger the RotateKeyPair Lambda function to initialize the public/private key-pair
    new LambdaTrigger(this, 'RotateKeyPairLambdaTrigger', rotateKeyPairLambda);

    const joinMeetingLambda = new EnhancedLambdaFunction(this, 'JoinMeeting', {
      initialPolicy: [ivsCreateResourcesPolicy, ivsTagResourcesPolicy],
      environment: {
        ...this.commonEnv,
        PRIVATE_KEY_SECRET_ARN: privateKeySecret.secretArn,
        PUBLIC_KEY_ARN_PARAM_NAME: publicKeyArnParam.parameterName
      },
      memorySize: 1769, // 1769 MB = 1 vCPU-second of credits per second
      entry: getLambdaEntryPath('api/joinMeeting'),
      functionName: createResourceName(this, 'JoinMeeting'),
      description: 'Joins an existing meeting or creates a new one'
    });
    const joinMeetingAlias = joinMeetingLambda.configureProvisionedConcurrency({
      minCapacity: this.isDev ? 1 : 10
    });
    this.addMeetingAPILambdaProxy(joinMeetingAlias, {
      httpMethod: 'POST',
      resourcePath: ['meeting', 'join']
    });
    privateKeySecret.grantRead(joinMeetingLambda);
    publicKeyArnParam.grantRead(joinMeetingLambda);
    this.meetingsTable.grantReadWriteData(joinMeetingLambda);

    const getMeetingLambda = new EnhancedLambdaFunction(this, 'GetMeeting', {
      environment: this.commonEnv,
      entry: getLambdaEntryPath('api/getMeeting'),
      functionName: createResourceName(this, 'GetMeeting'),
      description: 'Returns a meeting summary for a specified meeting ID'
    });
    const getMeetingAlias = getMeetingLambda.configureProvisionedConcurrency({
      minCapacity: this.isDev ? 1 : 10
    });
    this.addMeetingAPILambdaProxy(getMeetingAlias, {
      resourcePath: ['meetings', '{proxy+}']
    });
    this.meetingsTable.grantReadData(getMeetingLambda);

    const createChatTokenLambda = new EnhancedLambdaFunction(
      this,
      'CreateChatToken',
      {
        initialPolicy: [ivsChatCreateTokensPolicy],
        environment: this.commonEnv,
        entry: getLambdaEntryPath('api/createChatToken'),
        functionName: createResourceName(this, 'CreateChatToken'),
        description:
          'Creates a chat token - intended to be used as the token provider for the Amazon IVS Chat Client Messaging SDK'
      }
    );
    const createChatTokenAlias =
      createChatTokenLambda.configureProvisionedConcurrency();
    this.addMeetingAPILambdaProxy(createChatTokenAlias, {
      httpMethod: 'POST',
      resourcePath: ['chat', 'token', 'create']
    });
    this.meetingsTable.grantReadData(createChatTokenLambda);

    const cleanMeetingsLambda = new EnhancedLambdaFunction(
      this,
      'CleanMeetings',
      {
        initialPolicy: [ivsDeleteResourcesPolicy, ivsGetResourcesPolicy],
        environment: this.commonEnv,
        timeout: Duration.minutes(5),
        entry: getLambdaEntryPath('cleanMeetings'),
        functionName: createResourceName(this, 'CleanMeetings'),
        description:
          'Deletes stale resources (i.e. Stages, Chat Rooms and Meeting records)'
      }
    );
    this.meetingsTable.grantReadWriteData(cleanMeetingsLambda);

    const updatePublishersLambda = new EnhancedLambdaFunction(
      this,
      'UpdatePublishers',
      {
        environment: this.commonEnv,
        timeout: Duration.seconds(30),
        initialPolicy: [ivsGetResourcesPolicy],
        logRetention: logs.RetentionDays.ONE_MONTH,
        entry: getLambdaEntryPath('updatePublishers'),
        functionName: createResourceName(this, 'UpdatePublishers'),
        description: 'Updates Stage publishers via Stage Update events'
      }
    );
    this.meetingsTable.grantWriteData(updatePublishersLambda);

    const updateSubscribersLambda = new EnhancedLambdaFunction(
      this,
      'UpdateSubscribers',
      {
        environment: this.commonEnv,
        timeout: Duration.minutes(5),
        initialPolicy: [ivsGetResourcesPolicy],
        logRetention: logs.RetentionDays.ONE_WEEK,
        entry: getLambdaEntryPath('updateSubscribers'),
        functionName: createResourceName(this, 'UpdateSubscribers'),
        description: 'Updates Stage subscribers for active meetings'
      }
    );
    this.meetingsTable.grantReadWriteData(updateSubscribersLambda);

    const scheduleSubscriberUpdatesLambda = new EnhancedLambdaFunction(
      this,
      'ScheduleSubscriberUpdates',
      {
        environment: this.commonEnv,
        retryAttempts: 0,
        reservedConcurrentExecutions: 1,
        initialPolicy: [ivsGetResourcesPolicy],
        logRetention: logs.RetentionDays.ONE_WEEK,
        entry: getLambdaEntryPath('scheduleSubscriberUpdates'),
        functionName: createResourceName(this, 'ScheduleSubscriberUpdates'),
        description: 'Schedules updates for active meetings'
      }
    );
    this.meetingsTable.grantReadData(scheduleSubscriberUpdatesLambda);

    const activeMeetingsQueue = new sqs.Queue(this, 'ActiveMeetingsQueue', {
      queueName: `${createResourceName(this, 'ActiveMeetingsQueue')}.fifo`,
      contentBasedDeduplication: true,
      receiveMessageWaitTime: Duration.seconds(20),
      visibilityTimeout: calcVisibilityTimeout(updateSubscribersLambda),
      retentionPeriod: Duration.seconds(
        // retentionPeriod = maxReceiveCount * visibilityTimeout
        2 * calcVisibilityTimeout(updateSubscribersLambda).toSeconds()
      )
    });
    activeMeetingsQueue.grantSendMessages(scheduleSubscriberUpdatesLambda);
    scheduleSubscriberUpdatesLambda.addEnvironment(
      'ACTIVE_MEETINGS_QUEUE_URL',
      activeMeetingsQueue.queueUrl
    );
    updateSubscribersLambda.addEventSource(
      new eventSources.SqsEventSource(activeMeetingsQueue, {
        batchSize: 3,
        maxConcurrency: 2
      })
    );

    new events.Rule(this, 'StageUpdateRule', {
      ruleName: createResourceName(this, 'StageUpdateRule'),
      targets: [new targets.LambdaFunction(updatePublishersLambda)],
      eventPattern: {
        region: [this.region],
        account: [this.account],
        source: ['aws.ivs'],
        detailType: ['IVS Stage Update']
      }
    });
    new EventScheduleRule(this, 'ScheduleSubscriberUpdatesRule', {
      cronSchedule: { second: '0-59/1', minute: '*' }, // Run every second
      lambdaFunction: scheduleSubscriberUpdatesLambda
    });
    new EventScheduleRule(this, 'CleanMeetingsRule', {
      cronSchedule: { minute: '0', hour: this.isDev ? '0-23/6' : '0-23/1' }, // Run every 6 hours in Dev, and every hour otherwise
      lambdaFunction: cleanMeetingsLambda
    });

    /**
     * Stack Outputs
     */
    new CfnOutput(this, 'apiRegion', {
      value: this.region,
      exportName: createExportName(this, 'apiRegion')
    });
    new CfnOutput(this, 'appSyncExports', {
      value: JSON.stringify(this.appSyncExports, null, 2),
      exportName: createExportName(this, 'appSyncExports')
    });
    new CfnOutput(this, 'cognitoExports', {
      value: JSON.stringify(this.cognitoExports, null, 2),
      exportName: createExportName(this, 'cognitoExports')
    });
    new CfnOutput(this, 'rotateKeyPairFunctionName', {
      value: rotateKeyPairLambda.functionName,
      exportName: createExportName(this, 'rotateKeyPairFunctionName')
    });
  }

  private get isDev() {
    return this.appEnv === AppEnv.DEV;
  }

  private get commonEnv() {
    return {
      ALIAS_INDEX_NAME: this.aliasIndexName,
      ACTIVE_MEETINGS_INDEX_NAME: this.activeMeetingIndexName,
      MEETINGS_TABLE_NAME: this.meetingsTable.tableName
    };
  }

  private get appSyncExports() {
    return {
      defaultAuthMode: 'userPool',
      endpoint: this.messagesApi.graphqlUrl
    };
  }

  private get cognitoExports() {
    return {
      userPoolId: this.userPool.userPoolId,
      userPoolClientId: this.userPoolClient.userPoolClientId
    };
  }

  private addMeetingAPILambdaProxy(
    lambdaFunction: lambda.Function | lambda.Alias,
    options: { resourcePath?: string[]; httpMethod?: string }
  ) {
    const { resourcePath = [], httpMethod = 'GET' } = options ?? {};
    const resource = resourcePath.reduce<apigw.IResource>(
      (res, pathPart) => res.addResource(pathPart),
      this.meetingsApi.root
    );
    const lambdaIntegration = new apigw.LambdaIntegration(lambdaFunction, {
      proxy: true,
      allowTestInvoke: false
    });

    return resource.addMethod(httpMethod, lambdaIntegration, {
      authorizer: this.authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO
    });
  }
}

export default BackendStack;
