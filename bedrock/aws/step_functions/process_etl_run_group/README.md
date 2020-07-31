# Process ETL Run Group
This step function runs all ETL jobs associated with a particular run group (e.g., daily jobs or monthly jobs) in an order that ensures that no job is run before any job it depends on successfully completes.

In the initialization step (the ```create_run_map``` lambda function), the list of all jobs in the run group is analyzed and reorganized into a list of _run_sets_. Each run_set consists of a list of data asset ETL _jobs_ which can be run in parallel. 

An ETL _job_ consists of a list of one or more ETL _tasks_ that are to be run sequentially.

Thus, at a high level, the ```process_etl_run_group``` step function consists of an initialization followed by an outer loop over _run_sets_. Within that loop there is a ```map``` state that processes the ETL jobs in a _run_set_ in parallel. The map iterator consists of an inner loop that runs the ETL job tasks in sequence (this can't be implemented as a map since we need to abort the sequence if a task fails).
