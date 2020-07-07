import os
import sys
import json
import urllib.parse
import boto3

PYTHON_RUNTIME = 'python3.8'
JS_RUNTIME = 'nodejs12.x'
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

def create_function(lmda, iam, dir):
    runtime = PYTHON_RUNTIME
    if (os.path.isfile(dir + 'package.json')):
        runtime = JS_RUNTIME
    with open(dir+'/config.json', 'r') as file_content:
        config = json.load(file_content)
    print('     Create ' + config['name'])
    with open(dir+'/function.zip','rb') as zip_content:
        zip = zip_content.read()
    response = lmda.create_function(
        FunctionName=config['name'],
        Runtime=runtime,
        Role=iam.get_role(RoleName=config['role'])['Role']['Arn'],
        Handler='handler.lambda_handler',
        Publish=True,
        Code={ 'ZipFile':zip }
    )
    print(response)


def update_function(lmda, dir):
    with open(dir+'/config.json', 'r') as file_content:
        config = json.load(file_content)
    print('     Update ' + config['name'])
    with open(dir+'/function.zip','rb') as zip_content:
        zip = zip_content.read()
    response = lmda.update_function_code(
        FunctionName=config['name'],
        Publish=True,
        ZipFile= zip
    )
    print(response)


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
    if (os.path.exists('./lambda_functions/' + dir + '/' + 'config.json')):
        try:
            lmda.get_function(FunctionName=dir)
            try:
                update_function(lmda, './lambda_functions/' + dir)
            except:
                print('Error updating function code for ' + dir)
                print(sys.exc_info()[0])
        except:
            create_function(lmda, iam, './lambda_functions/' + dir)
