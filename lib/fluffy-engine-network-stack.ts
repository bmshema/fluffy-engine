import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  instanceId?: string;
}

export class FluffyEngineNetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly nlbSecurityGroup: ec2.SecurityGroup;
  public readonly serverSecurityGroup: ec2.SecurityGroup;
  
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // const adminIp = ssm.StringParameter.valueFromLookup(this, '/environment/admin-ip');
    // const wgPort = ssm.StringParameter.valueFromLookup(this, '/environment/wg-port');

    // VPC
    this.vpc = new ec2.Vpc(this, 'FluffyEngineVPC', {
      ipAddresses: ec2.IpAddresses.cidr('172.31.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ]
    });

    // Network Load Balancer Security Group
    this.nlbSecurityGroup = new ec2.SecurityGroup(this, 'FluffyEngineNLB-SG', {
      vpc: this.vpc,
      description: 'Security group for Fluffy Engine NLB',
      allowAllOutbound: true,
    });

    // Inbound rule of UDP 443
    this.nlbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(443),
      'Allows VPN client traffic on UDP 443'
    );

    const nlb = new elbv2.NetworkLoadBalancer(this, 'FluffyEngineNLB', {
      vpc: this.vpc,
      internetFacing: true,
      crossZoneEnabled: true,
    });

    // NLB Listener
    const listener = nlb.addListener('FluffyEngineListener', {
      port: 443,
      protocol: elbv2.Protocol.UDP,
    });

    // Create target group for VPN
    const targetGroup = new elbv2.NetworkTargetGroup(this, 'FluffyEngineTargetGroup', {
      vpc: this.vpc,
      port: 51260,
      protocol: elbv2.Protocol.UDP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        protocol: elbv2.Protocol.TCP,
        port: '22',
        healthyThresholdCount: 5,
        unhealthyThresholdCount: 5,
      }
    });

    // Add target group to listenter
    listener.addTargetGroups('DefaultTargetGroup', targetGroup)

    // EC2 Security group
    this.serverSecurityGroup = new ec2.SecurityGroup(this, 'FluggyEngineSecurityGroup', {
      vpc: this.vpc,
      description: 'Security Group for Fluffy Engine Server',
      allowAllOutbound: true,
    });

    // Inbound rule for SSH
    this.serverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('<YOURADMINIP>'),
      ec2.Port.tcp(22),
      'Allow SSH from admin IP only'
    );

    // ec2 inbound rule for wireguard client traffic
    this.serverSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.nlbSecurityGroup.securityGroupId),
      ec2.Port.udp(<YOUR-WIREGUARD-SERVER-PORT>),
      'Allow VPN traffic from NLB only'
    );

    // Output the network resources
    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new cdk.CfnOutput(this, 'NlbDnsName', { value: nlb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'TargetGroupArn', { value: targetGroup.targetGroupArn});
  }
}
