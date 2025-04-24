#!/bin/bash

# Exit on error
set -e

# Set Default Values from env.json
DEFAULT_AWS_ACCOUNT=$(jq -r '.AWSAccount' sam_templates/env.json)
DEFAULT_STACK_NAME=$(jq -r '.StackName' sam_templates/env.json)

# Function to check stack status and delete if in ROLLBACK_COMPLETE
check_and_delete_stack() {
    local stack_name=$1
    local aws_profile=$2
    local status=$(aws --profile $aws_profile cloudformation describe-stacks \
      --stack-name $stack_name \
      --query "Stacks[0].StackStatus" \
      --output text \
      2>/dev/null || echo "NOT_FOUND")

    if [ "$status" == "ROLLBACK_COMPLETE" ]; then
        echo "Stack $stack_name is in ROLLBACK_COMPLETE state. Deleting before redeploying..."
        aws --profile $aws_profile cloudformation delete-stack --stack-name $stack_name
        aws --profile $aws_profile cloudformation wait stack-delete-complete --stack-name $stack_name
    fi
}
