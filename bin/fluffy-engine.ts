#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FluffyEngineServerStack } from '../lib/fluffy-engine-server-stack';
import { FluffyEngineNetworkStack } from '../lib/fluffy-engine-network-stack';

const app = new cdk.App();

// Define environment configuration
const envConfig = {
  account: '<YOURACCOUNTID>',
  region: '<REGION>'       
};

// Create the network stack
const networkStack = new FluffyEngineNetworkStack(app, 'FluffyEngineNetworkStack', {
  env: envConfig
});

// Create the server stack
const serverStack = new FluffyEngineServerStack(app, 'FluffyEngineServerStack', {
  vpc: networkStack.vpc,
  securityGroup: networkStack.serverSecurityGroup,
  env: envConfig
});

serverStack.addDependency(networkStack);