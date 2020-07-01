import os
import json
import urllib.parse
import boto3

def subdirs(path):
    for dir in os.listdir(path):
        if os.path.isdir(os.path.join(path, dir)):
            yield dir

def create_role(path, rolename):
    try:
        print('      Creating role: ' + rolename)
        config_file = './roles/' + rolename + '/' + rolename + '_config.json'
        with open(config_file, 'r') as file_content:
            config = json.load(file_content)
        iam.create_role(RoleName=dir, AssumeRolePolicyDocument = json.dumps(config['trust']))
        role = boto3.resource('iam').Role(dir)
        for arn in config["policy_arns"]:
            role.attach_policy(PolicyArn=arn)
    except:
        print('Error creating role ' + rolename)

def create_function(path, fct_name):
    print('     Create ' + fct_name)

def update_function(path, fct_name):
    print('     Update ' + fct_name)


###########################
# Deploy all AWS resources
###########################

# Deploy roles
print('Deploying roles')
iam = boto3.client('iam')
for dir in subdirs('./roles'):
    try:
        role = iam.get_role(RoleName=dir)
        print('      Role ' + dir + ' already created ... skipping')
    except:
        create_role('./roles', dir)

# Deploy lambda functions
print('Deploying lambdas')
lmda = boto3.client('lambda')

for dir in subdirs('./lambda_functions'):
    try:
        fct = lmda.get_function(FunctionName=dir)
        update_lambda('./lambda_functions', dir)
    except:
        create_function('./lambda_functions', dir)
