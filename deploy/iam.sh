#!/bin/bash

# Source the shared configuration
source "$(dirname "$0")/config.sh"

# Use defaults from config
AWS_ACCOUNT="${DEFAULT_AWS_ACCOUNT}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --profile)
            AWS_ACCOUNT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

STACK_NAME="${DEFAULT_STACK_NAME}-iam"

# Check and delete stack if in ROLLBACK_COMPLETE state
check_and_delete_stack ${STACK_NAME}

# Read parameters from env.json
IDENTITY_CENTER_INSTANCE_ARN=$(jq -r '.IdentityCenterInstanceArn' sam_templates/env.json)
DEV_GROUP_ID=$(jq -r '.DevGroupId' sam_templates/env.json)
PROD_GROUP_ID=$(jq -r '.ProdGroupId' sam_templates/env.json)
DEV_ACCOUNT_ID=$(jq -r '.DevAccountId' sam_templates/env.json)
PROD_ACCOUNT_ID=$(jq -r '.ProdAccountId' sam_templates/env.json)

# Deploy the IAM stack
echo "Deploying IAM infrastructure..."
sam deploy \
  --template-file sam_templates/iam.yaml \
  --profile ${AWS_ACCOUNT} \
  --stack-name ${STACK_NAME} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    IdentityCenterInstanceArn=${IDENTITY_CENTER_INSTANCE_ARN} \
    DevGroupId=${DEV_GROUP_ID} \
    ProdGroupId=${PROD_GROUP_ID} \
    DevAccountId=${DEV_ACCOUNT_ID} \
    ProdAccountId=${PROD_ACCOUNT_ID}

# Wait for deployment to complete
aws --profile $AWS_ACCOUNT cloudformation wait stack-create-complete --stack-name $STACK_NAME