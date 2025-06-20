# fluffy-engine

An AWS CDK app that provisions one or more EC2 instances behind a network load balancer with basic target group traffic routing for Wireguard VPN clients.

![image](https://github.com/user-attachments/assets/a32a4d12-2ca1-4813-8e9b-2bf81af6f9af)

## Setup for Your Environment:
### /bin/fluffyengine.ts:
- Change envConfig to your accountID and region.
```ts
const envConfig = {
  account: '<YOURACCOUNTID>',
  region: '<REGION>'    
};
```
### /lib/fluffy-engine-network-stack.ts:
- Change EC2 inbound rule parameter to your admin IP address.
```ts
this.serverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('<YOURADMINIP>'),
      ec2.Port.tcp(22),
      'Allow SSH from admin IP only'
    );
```
- Add your Wireguard server port to the EC2 ingress rules
```ts
this.serverSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.nlbSecurityGroup.securityGroupId),
      ec2.Port.udp(<YOUR-WIREGUARD-SERVER-PORT>),
      'Allow VPN traffic from NLB only'
    );
```
### Wireguard Endpoint:
In your Wireguard client confifurations, the EndPoint parameter will be "networkLoadBalancerDNSName:443".
- Example: `my-example-nlb-4e2d1f8bb2751e6a.elb.eu-central-1.amazonaws.com:433`

## Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
