#!/bin/bash

# Exit on error
set -e

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

STACK_NAME="${DEFAULT_STACK_NAME}-cognito-${AWS_ACCOUNT}"

# Validate AWS profile
if [ -z "$AWS_ACCOUNT" ]; then
    echo "Error: AWS_ACCOUNT environment variable must be set"
    echo "Usage: AWS_ACCOUNT=<profile-name> ./deploy_cognito.sh"
    exit 1
fi

# Print deployment parameters
echo "Deploying Cognito infrastructure with the following parameters:"
echo "AWS Profile: $AWS_ACCOUNT"
echo "Stack Name: $STACK_NAME"

# Check and delete stack if in ROLLBACK_COMPLETE state
check_and_delete_stack $STACK_NAME $AWS_ACCOUNT

# Deploy the Cognito template
echo "Deploying Cognito infrastructure..."
sam deploy \
    --profile $AWS_ACCOUNT \
    --template-file sam_templates/cognito.yaml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM \
    --no-fail-on-empty-changeset

# Wait for deployment to complete
aws --profile $AWS_ACCOUNT cloudformation wait stack-create-complete --stack-name $STACK_NAME
