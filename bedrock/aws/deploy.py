import os
import json
import urllib.parse
import boto3

def subdirs(path):
    for dir in os.listdir(path):
        if os.path.isdir(os.path.join(path, dir)):
            yield dir

def create_role(iam, path, rolename):
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

def create_function(lmda, path, fct_name):
    print('     Create ' + fct_name)
    config_file = './lambda_functions/' + fct_name + '/' + fct_name + '_config.json'
    zipfile = './lambda_functions/' + fct_name + '/function.zip'
    with open(config_file, 'r') as file_content:
        config = json.load(file_content)
    with open(zipfile,'rb') as zip_content:
        zip = zip_content.read()
    response = lmda.create_function(
        FunctionName=config['name'],
        Runtime=config['runtime'],
        Role=config['role'],
        Handler=config['handler'],
        Publish=True,
        Code={
            'ZipFile':zip
        },
        Environment=config['environment']
    )
    print(response)


def update_function(lmda, path, fct_name):
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
        create_role(iam, './roles', dir)

# Deploy lambda functions
print('Deploying lambdas')
lmda = boto3.client('lambda')

for dir in subdirs('./lambda_functions'):
    if (os.path.exists('./lambda_functions/' + dir + '/' + dir + '_config.json')):
        try:
            lmda.get_function(FunctionName=dir)
            update_function(lmda, './lambda_functions', dir)
        except:
            create_function(lmda, './lambda_functions', dir)
