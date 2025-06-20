import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface ServerStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class FluffyEngineServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerStackProps) {
    super(scope, id, props);

    // Create 1 or more EC2 Instances
    const instanceCount = 1;

    for (let i = 0; i < instanceCount; i++) {
      // Create EC2 instance(s)
      const instance = new ec2.Instance(this, `FluffyEngineServer-${i}`, {
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.M4, ec2.InstanceSize.SMALL),
        machineImage: ec2.MachineImage.fromSsmParameter(
          '/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id',
          { os: ec2.OperatingSystemType.LINUX}
        ),
        userData: ec2.UserData.forLinux(),
        securityGroup: props.securityGroup,
        keyPair: ec2.KeyPair.fromKeyPairName(this, `ImportedKeyPair=${i}`, 'fluffyengine'),
        associatePublicIpAddress: true,
      });

      //User Scripts
      instance.userData.addCommands(
        'sudo apt-get update',
        'sudo apt-get upgrade -y',
        'sudo apt-get install -y git wireguard jq resolvconf',
        'sudo systemctl restart sshd',
        'git clone https://github.com/complexorganizations/wireguard-manager-git /home/ubuntu/wireguard-manager',
        `echo "User scripts complete on instance ${i}" > /home/ubuntu/setup-complete`,
      );

      // Output Instance's IP
      new cdk.CfnOutput(this, `InstancePublicIP-${i}`, {
        value: instance.instancePublicIp,
        description: `Public IP address of EC2 instance ${i}`,
      });

      // Output the instance ID
      new cdk.CfnOutput(this, `InstanceId-${i}`, {
        value: instance.instanceId,
        description: `ID of EC2 instance ${i} for target group registrantion`,
      });
    }
  }
}
