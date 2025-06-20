import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface NerworkStackProps extends cdk.StackProps {
  instanceId?: string;
}

export class FluffyEngineNetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly nlbSecurityGroup: ec2.SecurityGroup;
  public readonly serverSecurityGroup: ec2.SecurityGroup;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, 'FluffyEngineVPC', {
      ipAddresses: ec2.IpAddresses.cidr('172.31.0.0/16'),
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ]
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'FluffyEngineQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
