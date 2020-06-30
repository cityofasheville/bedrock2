import os
import json
import urllib.parse
import boto3

def subdirs(path):
    for dir in os.listdir(path):
        if os.path.isdir(os.path.join(path, dir)):
            yield dir

# Deploy all the roles
print('Deploying roles')
iam = boto3.client('iam')

def create_role(path, rolename):
    try:
        print('      Creating role: ' + rolename)
        full_dir = './roles/' + rolename + '/'
        trust_policy_file = rolename + '_trust.json'
        with open(full_dir + trust_policy_file, 'r') as file_content:
            trust_policy = json.load(file_content)
        iam.create_role(RoleName=dir, AssumeRolePolicyDocument = json.dumps(trust_policy))
        policy_file = rolename + '_policies.json'
        with open(full_dir + policy_file, 'r') as file_content:
            policy = json.load(file_content)
        role = boto3.resource('iam').Role(dir)
        for arn in policy["policy_arns"]:
            role.attach_policy(PolicyArn=arn)
    except:
        print('Error creating role ' + rolename)

for dir in subdirs("./roles"):
    try:
        role = iam.get_role(RoleName=dir)
        print('      Role ' + dir + ' already created ... skipping')
    except:
        create_role('./roles', dir)

# Deploy all the lambda functions
print('Deploying lambdas')

for dir in subdirs("./lambda_functions"):
    print ('   ' + dir)
