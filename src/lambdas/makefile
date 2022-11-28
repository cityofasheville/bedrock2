dirs = etl_task_noop check_etl_job_task_status create_etl_run_map etl_email_results etl_task_encrypt etl_task_file_copy etl_task_sftp etl_task_sql etl_task_table_copy etl_task_unknown setup_etl_job_task update_etl_run_map

.PHONY: $(dirs) init plan apply destroy clean

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
destroy: $(dirs)
clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)