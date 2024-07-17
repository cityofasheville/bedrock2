#!/usr/bin/env python3
def update_run_map(state):
    newstate = {}
    newstate['success'] = state['success']
    newstate['noemail'] = state['noemail'] # successful jobs that should not send email
    newstate['skipped'] = state['skipped']
    newstate['failure'] = state['failure']

    jobs = state['runsets'].pop(0)
    results = state['results']
    fails = {}
    for i in range(len(jobs)): # each asset
        job = jobs[i]
        result = results[i]['ETLJob']
        name = result['name']
        success = True
        email = ''
        for j in range(len(result['etl_tasks'])): # each task
            if 'email' in result['etl_tasks'][j]:
                email = result['etl_tasks'][j]['email']

            task_result = result['etl_tasks'][j]['result']
            if 'statusCode' not in task_result or task_result['statusCode'] != 200:
                newstate['failure'].append({
                    "name": name,
                    "job": job,
                    "result": result
                })
                fails[name] = True
                success = False
                break
            if not success:
                break

        if success:
            if email == 'only_on_error':
                newstate['noemail'].append(name)
            else:
                newstate['success'].append(name)

    # Purge all jobs from state['remainder'] that depend on failed or skipped jobs
    newremainder = []
    while len(state['runsets']) > 0:
        jobset = state['runsets'].pop(0)
        jobs = []
        while (len(jobset)) > 0:
            job = jobset.pop(0)
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