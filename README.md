# Fluffy Engine - WireGuard VPN Infrastructure

A production-ready AWS CDK application that deploys a scalable WireGuard VPN infrastructure using AWS best practices. This project provisions a highly available VPN solution with EC2 instances behind a Network Load Balancer, designed for secure remote access and privacy protection.

![Architecture Diagram](https://github.com/user-attachments/assets/a32a4d12-2ca1-4813-8e9b-2bf81af6f9af)

## 🏗️ Architecture Overview

This CDK application creates a complete VPN infrastructure consisting of:

- **VPC with Multi-AZ Setup**: Custom VPC (172.31.0.0/16) spanning configurable Availability Zones with public subnets
- **Network Load Balancer**: Internet-facing NLB handling UDP traffic on port 443 for VPN clients
- **EC2 WireGuard Server**: Ubuntu 22.04 instances (t3.medium) with automated WireGuard and dependency installation
- **Security Groups**: Layered security with separate groups for NLB and EC2 instances
- **Target Groups**: Health-checked routing from NLB to WireGuard servers
- **Wireguard Mangement and Dependencies**: Automated WireGuard and dependency install with wireguard-manager git repo cloned from [ComplexOrganizations](https://github.com/complexorganizations).

### Traffic Flow
1. VPN clients connect to the NLB public endpoint on UDP:443
2. NLB distributes traffic to WireGuard servers on configurable WireGuard port
3. WireGuard servers handle VPN tunneling and routing
4. Admin access via SSH is restricted to specified IP address

## 🚀 Features

- **High Availability**: Multi-AZ deployment with automatic failover
- **Scalable**: Easy to add more WireGuard servers by adjusting instance count
- **Secure**: Network segmentation with least-privilege security groups
- **Automated**: Complete infrastructure provisioning and WireGuard installation
- **Cost-Effective**: Uses efficient t3.medium instances with no NAT gateways
- **Monitoring**: Built-in health checks and CloudFormation outputs for monitoring

## 📋 Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- An existing EC2 Key Pair in your target region (configurable name)

## ⚙️ Required Configuration

Before deploying, you must configure these key settings:

### 🔧 1. Environment Setup (`bin/fluffy-engine.ts`)
Update the environment configuration with your AWS account details:

```typescript
const envConfig = {
  account: 'YOUR_AWS_ACCOUNT_ID',    // ⚠️ REQUIRED: Your 12-digit AWS account ID
  region: 'YOUR_AWS_REGION'          // ⚠️ REQUIRED: Your target AWS region
};
```

### 🔒 2. Admin IP Configuration (`lib/fluffy-engine-network-stack.ts`)
**⚠️ CRITICAL SECURITY SETTING** - Configure SSH access by updating line ~85 with your IP address:

```typescript
// Inbound rule for SSH
this.serverSecurityGroup.addIngressRule(
  ec2.Peer.ipv4('YOUR_ADMIN_IP/32'),  // ⚠️ REQUIRED: Replace with your public IP
  ec2.Port.tcp(22),
  'Allow SSH from admin IP only'
);
```

### 🔌 3. WireGuard Port Configuration (`lib/fluffy-engine-network-stack.ts`)
Configure the WireGuard server port:

```typescript
// Target Group configuration (line ~60)
const targetGroup = new elbv2.NetworkTargetGroup(this, 'FluffyEngineTargetGroup', {
  vpc: this.vpc,
  port: 51280,  // ⚠️ CONFIGURE: Your WireGuard server port
  protocol: elbv2.Protocol.UDP,
  // ... rest of config
});

// Security Group rule (line ~90)
this.serverSecurityGroup.addIngressRule(
  ec2.Peer.securityGroupId(this.nlbSecurityGroup.securityGroupId),
  ec2.Port.udp(51280),  // ⚠️ CONFIGURE: Must match target group port above
  'Allow VPN traffic from NLB only'
);
```

### 🖥️ 4. Instance Count Configuration (`lib/fluffy-engine-server-stack.ts`)
Set the number of WireGuard servers (line ~15):

```typescript
// Create 1 or more EC2 Instances
const instanceCount = 1;  // ⚠️ CONFIGURE: Number of EC2 instances
```

### 🔑 5. Key Pair Configuration (`lib/fluffy-engine-server-stack.ts`)
Set your EC2 Key Pair name (line ~30):

```typescript
keyPair: ec2.KeyPair.fromKeyPairName(this, `ImportedKeyPair=${i}`, 'fluffyengine'),
//                                                                   ↑
//                                    ⚠️ CONFIGURE: Your key pair name
```

### 🌐 6. Availability Zones Configuration (`lib/fluffy-engine-network-stack.ts`)
Configure the number of Availability Zones:

```typescript
// VPC
this.vpc = new ec2.Vpc(this, 'FluffyEngineVPC', {
  ipAddresses: ec2.IpAddresses.cidr('172.31.0.0/16'),
  maxAzs: 2,  // ⚠️ CONFIGURE: Number of AZs (1-6, recommend 2-3 for HA)
  natGateways: 0,
  // ... rest of config
});
```

## 🚀 Deployment

1. **Create EC2 Key Pair** (if you don't have one):
   ```bash
   aws ec2 create-key-pair --key-name YOUR_KEY_PAIR_NAME --query 'KeyMaterial' --output text > your-key.pem
   chmod 400 your-key.pem
   ```

   Or create it in the AWS management console

2. **Get your public IP** for admin access if logged in:
   ```bash
   curl -s https://checkip.amazonaws.com
   ```
   Or get the IP from the instance in AWS management console

3. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap 
   ```

4. **Deploy the infrastructure**:
   ```bash
   npm install
   npm run build
   cdk deploy --all
   ```

5. **Get the NLB Target Group ARN and EC2 instance ID** from the CloudFormation outputs and manually register the EC2 instance with the Target Group.
    ```ts
    aws elbv2 register-targets --target-group-arn YOUR_TARGET_GROUP_ARN --targets Id=INSTANCE_ID
    ```

6. **Get the NLB DNS name** from the CloudFormation outputs and use it as your WireGuard endpoint.

## 🔧 WireGuard Client Configuration

After deployment, configure your WireGuard clients with:

```ini
[Interface]
# Your client configuration

[Peer]
Endpoint = YOUR_NLB_DNS_NAME:443
# Additional peer configuration
```

Example endpoint: `my-nlb-4e2d1f8bb2751e6a.elb.us-east-1.amazonaws.com:443`

## 📊 Monitoring and Management

The deployment provides several CloudFormation outputs:
- **VPC ID**: For network reference
- **NLB DNS Name**: Your VPN endpoint
- **Target Group ARN**: For monitoring target health
- **Instance IDs**: For direct instance management
- **Public IPs**: For SSH access and troubleshooting

## 🛠️ Advanced Customization

### Scaling Options
- **Horizontal Scaling**: Increase `instanceCount` for more servers
- **Vertical Scaling**: Change instance type from `ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM`
- **Geographic Scaling**: Adjust `maxAzs` for wider distribution

### Network Customization
- **VPC CIDR**: Change from `172.31.0.0/16` to your preferred range
- **Subnet Configuration**: Modify subnet CIDR masks and types
- **Load Balancer**: Adjust NLB settings for different traffic patterns

## 🔒 Security Considerations

- **Admin Access**: SSH restricted to specified IP addresses only
- **Network Isolation**: VPN traffic isolated using security group rules  
- **Minimal Attack Surface**: No inbound internet access except VPN and admin SSH
- **Health Monitoring**: Continuous health checks ensure service availability
- **Key Management**: EC2 instances use specified key pairs for secure access

### Security Enhancements
- **Multiple Admin IPs**: Add additional SSH access rules as needed
- **Custom Ports**: Change default ports for your needs
- **VPC Flow Logs**: Add logging for network traffic analysis

## 💰 Cost Optimization

- **No NAT Costs**: Uses public subnets only (no NAT Gateway fees)
- **Efficient Instances**: t3.medium instances with burstable performance
- **Optimized Load Balancer**: Network Load Balancer optimized for UDP traffic
- **Direct Routing**: Minimal data transfer costs with direct internet routing

## 🛠️ Development Commands

* `npm run build`   - Compile TypeScript to JavaScript
* `npm run watch`   - Watch for changes and compile automatically
* `npm run test`    - Run Jest unit tests
* `cdk deploy`      - Deploy stacks to AWS
* `cdk diff`        - Compare deployed stack with current state
* `cdk synth`       - Generate CloudFormation templates
* `cdk destroy`     - Remove all deployed resources

## 🚨 Important Notes

- **Security**: Always restrict admin IP access to specific IP addresses
- **Ports**: Ensure WireGuard port consistency between target group and security group
- **Key Pairs**: Verify your key pair exists in the target region before deployment
- **Costs**: Monitor AWS costs, especially for multiple instances and data transfer
- **Updates**: Regularly update the Ubuntu AMI and WireGuard software

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.