  
#!/usr/bin/env python3
import boto3
import os
import json

def update_run_map(state):
    newstate = {}
    newstate['success'] = state['success']
    newstate['skipped'] = state['skipped']
    newstate['failure'] = state['failure']

    jobs = state['next']
    results = state['results']
    fails = {}
    for i in range(len(jobs)):
        job = jobs[i]
        result = results[i]['ETLJob']
        name = result['name']
        print ('Run ' + str(i) + ' ' + name)
        for j in range(len(result['etl_tasks'])):
            task_result = result['jobresults'][j]
            if 'statusCode' not in task_result or task_result['statusCode'] != 200:
                print('   Task ' + str(j) + ' of job ' + name + ' failed')
                newstate['failure'].append({
                    "name": name,
                    "job": job,
                    "result": result
                })
                fails[name] = True
                break
            else:
                print('   Task ' + str(j) + ' of job ' + name + ' succeeded')
                newstate['success'].append(name)
            if name in fails:
                break

    # Purge all jobs from state['remainder'] that depend on failed or skipped jobs
    newremainder = []
    while len(state['remainder']) > 0:
        jobset = state['remainder'].pop()
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
    newstate['next'] = None
    newstate['results'] = None
    if len(newremainder) > 0:
        newstate['next'] = newremainder.pop()
        newstate['remainder'] = newremainder
        newstate['go'] = True
    else:
        newstate['go'] = False

    return newstate



def lambda_handler(event, context):
    print('I am in update_run_map')
#    print(json.dumps(event))
    state = event['state']
    result = update_run_map(state)
#    result['go'] = False

    return {
        'statusCode': 200,
        'body': result
    }
