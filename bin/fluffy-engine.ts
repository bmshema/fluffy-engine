#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { FluffyEngineServerStack } from '../lib/fluffy-engine-server-stack';
import { FluffyEngineNetworkStack } from '../lib/fluffy-engine-network-stack';

const app = new cdk.App();

// Create stack to retrive env parameters
const envStack = new cdk.Stack(app, 'FluffyEngineEnvStack');

// Get account ID and region from env stack
const accountId = ssm.StringParameter.valueForStringParameter(envStack,'/environment/account-id');
const region = ssm.StringParameter.valueForStringParameter(envStack,'/environment/region');

// Create the network stack
const networkStack = new FluffyEngineNetworkStack(app, 'FluffyEngineNetworkStack', {
  env: {
    account: accountId,
    region: region,
  },
});

// Create the server stack
const serverStack = new FluffyEngineServerStack(app, 'FluffyEngineServerStack', {
  vpc: networkStack.vpc,
  securityGroup: networkStack.serverSecurityGroup,
  env: {
    account: accountId,
    region: region,
  }
});

serverStack.addDependency(networkStack);