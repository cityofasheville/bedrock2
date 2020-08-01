  
#!/usr/bin/env python3
import boto3
import os
import json

def update_run_map(state):
    newstate = {}
    newstate['success'] = state['success']
    newstate['skipped'] = state['skipped']
    newstate['failure'] = state['failure']

    jobs = state['runsets'].pop(0)
    results = state['results']
    fails = {}
    for i in range(len(jobs)):
        job = jobs[i]
        result = results[i]['ETLJob']
        name = result['name']
        for j in range(len(result['etl_tasks'])):
            task_result = result['etl_tasks'][j]['result']
            if 'statusCode' not in task_result or task_result['statusCode'] != 200:
                newstate['failure'].append({
                    "name": name,
                    "job": job,
                    "result": result
                })
                fails[name] = True
                break
            else:
                newstate['success'].append(name)
            if name in fails:
                break

    # Purge all jobs from state['remainder'] that depend on failed or skipped jobs
    newremainder = []
    while len(state['runsets']) > 0:
        jobset = state['runsets'].pop()
        jobs = []
        while (len(jobset)) > 0:
            job = jobset.pop()
            for i in range(len(job['depends'])):
                if job['depends'][i] in fails:
                    fails[job['name']] = True
                    newstate['skipped'].append(job['name'])
                    break
            if job['name'] not in fails:
                jobs.append(job)
        if len(jobs) > 0:
            newremainder.append(jobs)

    # See if there are any more jobs to run
    newstate['results'] = None
    if len(newremainder) > 0:
        newstate['runsets'] = newremainder
        newstate['RunSetIsGo'] = True
    else:
        newstate['RunSetIsGo'] = False

    return newstate



def lambda_handler(event, context):
    state = event['state']
    result = update_run_map(state)

    return {
        'statusCode': 200,
        'body': result
    }
