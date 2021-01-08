#!/usr/bin/env python3
"""
AWS 2 factor auth. Prompts for 6 digit code and prints 
out the three lines you need to run at the command prompt.

To use, add a file mfa_config.py in the same folder that holds your iam MFA arn and the matching profile name.
It can be just this one line:

mfadevice="arn:aws:iam::0000000000:mfa/name"; profilename="default"

"""
import subprocess
import json
import os
import mfa_config

def main(profilename, mfadevice):
    twofa = input("Enter two factor auth code for profile " + profilename + ": ") 
    cmd = 'aws sts get-session-token --serial-number ' + mfadevice + ' --profile ' + profilename + ' --token-code ' + twofa
    output = subprocess.check_output(cmd, shell=True)
    js = json.loads(output)

    print("\n")
    print(f"Valid until: {js['Credentials']['Expiration']}\n\n")
    print("Copy these and paste to run:")
    print("----------------------------")
    print("\n")
    print(f"export AWS_ACCESS_KEY_ID={js['Credentials']['AccessKeyId']}\n")
    print(f"export AWS_SECRET_ACCESS_KEY={js['Credentials']['SecretAccessKey']}\n")
    print(f"export AWS_SESSION_TOKEN={js['Credentials']['SessionToken']}\n")
    print("\n")

mfadevice = mfa_config.mfadevice
profilename = mfa_config.profilename
main(profilename, mfadevice)

