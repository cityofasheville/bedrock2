INSERT INTO standard.base_employee_sensitive_snapshots
(date_entered, employee_id, active, "sensitive", first_name, last_name, legal_first_name, 
legal_middle_name, legal_last_name, legal_name_suffix, primary_email, alt_email, division_id, division, 
department_id, department, position_name, ft_status, exempt_group, hire_date_original, hire_date_last, termination_date_last,
annual_base_pay,
supervisor_id, supervisor_name, supervisor_email, is_supervisor, supervisee_count, phone_desk, phone_cell, 
ad_username, ad_memberships, race_asian, race_black, race_native, race_pacific, race_white, ethnicity_hispanic, 
gender, age, age_at_hire, age_at_termination)
select current_date as date_entered, employee_id, active, "sensitive", first_name, last_name, 
legal_first_name, legal_middle_name, legal_last_name, legal_name_suffix, primary_email, alt_email, 
division_id, division, department_id, department, position_name, ft_status, exempt_group, hire_date_original, 
hire_date_last, termination_date_last, annual_base_pay, supervisor_id, supervisor_name, supervisor_email, is_supervisor, 
supervisee_count, phone_desk, phone_cell, ad_username, ad_memberships, race_asian, race_black, race_native, 
race_pacific, race_white, ethnicity_hispanic, gender, age, age_at_hire, age_at_termination
FROM standard.employee_sensitive;