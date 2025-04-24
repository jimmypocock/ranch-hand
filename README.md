# Ranch Hand

Ranch Hand is a multiplayer card game built on AWS infrastructure, featuring skill-based matchmaking and real-time gameplay. The game leverages AWS GameLift for matchmaking and server hosting, providing a scalable and reliable gaming experience.

## Architecture Overview

The game is built using a serverless, event-driven architecture with the following key components:

### Core Services
- **Amazon GameLift**: Handles matchmaking logic and game server hosting
- **Amazon Cognito**: Manages user authentication and identity
- **Amazon API Gateway**: Provides REST API endpoints for game interactions
- **AWS Lambda**: Executes serverless functions for game logic
- **Amazon DynamoDB**: Stores player data and game state
- **Amazon SNS**: Handles matchmaking notifications
- **Amazon CloudWatch**: Monitors system health and performance

### Infrastructure Components
- **Network Layer**: VPC with public and private subnets
- **Database Layer**:
  - DynamoDB for game state and player data
- **Security Layer**:
  - Cognito for authentication
  - IAM roles and security groups
  - Secrets Manager for sensitive data

## Game Features
- Skill-based matchmaking
- Party system support
- Real-time multiplayer gameplay
- Player skill tracking
- Low-latency game servers
- Cross-platform support

## Development Setup

### Prerequisites
- AWS CLI configured with appropriate credentials
- Python 3.12
- AWS SAM CLI
- Docker (for local testing)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Deployment
1. Configure your AWS credentials
2. Deploy the infrastructure:
   ```bash
   ./deploy.sh
   ```

### Local Development
1. Start the local API:
   ```bash
   sam local start-api
   ```
2. Run tests:
   ```bash
   make test
   ```

## Project Structure
- `sam_templates/`: AWS SAM templates
  - `core.yml`: Core infrastructure components
  - `cognito.yaml`: Authentication setup
  - `vpc.yaml`: Network configuration
  - `sns.yaml`: Notification services
  - `gamelift.yaml`: Game server and matchmaking
  - `dynamodb.yaml`: Database setup
  - `iam_admin.yaml`: IAM roles and permissions
- `proof_of_concept_html_js/`: Frontend prototype
- `notes/`: Design documents and planning
- `deploy.sh`: Deployment script

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[Add your license information here]

## Support
For support, please [add your support contact information]
