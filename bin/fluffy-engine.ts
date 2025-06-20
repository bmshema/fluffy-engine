#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FluffyEngineServerStack } from '../lib/fluffy-engine-server-stack';
import { FluffyEngineNetworkStack } from '../lib/fluffy-engine-network-stack';

const app = new cdk.App();

// Get deployment environment from context
const targetAccount = app.node.tryGetContext('account');
const targetRegion = app.node.tryGetContext('region');

if (!targetAccount || !targetRegion) {
  throw new Error('Please provide account and region through context. Example: cdk deploy --context account=123456789012 --context region=us-east-1');
}

// Create the network stack
const networkStack = new FluffyEngineNetworkStack(app, 'FluffyEngineNetworkStack', {
  env: {
    account: targetAccount,
    region: targetRegion,
  },
});

// Create the server stack
const serverStack = new FluffyEngineServerStack(app, 'FluffyEngineServerStack', {
  vpc: networkStack.vpc,
  securityGroup: networkStack.serverSecurityGroup,
  env: {
    account: targetAccount,
    region: targetRegion,
  }
});

serverStack.addDependency(networkStack);