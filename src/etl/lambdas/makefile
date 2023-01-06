include ../../make_variables

dirs = etl_task_noop etl_task_unknown etl_task_sql etl_task_table_copy etl_task_file_copy etl_task_sftp etl_task_encrypt etl_email_results check_etl_job_task_status create_etl_run_map setup_etl_job_task update_etl_run_map

.PHONY: $(dirs) init plan apply destroy clean

init: $(dirs)
plan: $(dirs)
apply: $(dirs)
apply-y: $(dirs)
destroy: $(call reverse,$(dirs))

clean: $(dirs)

$(dirs):
	$(MAKE) -C $@ $(MAKECMDGOALS)