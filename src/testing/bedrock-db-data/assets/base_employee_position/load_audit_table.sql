START TRANSACTION;
    INSERT INTO standard.events_base_employee_position
    (changedfieldname, primkey, oldval, newval, changeddate)
    select * from standard.find_events('standard.base_employee_position' , 'temp.base_employee_position_temp' , 'employee_id' );
    truncate table standard.base_employee_position;
    insert into standard.base_employee_position
    select * from temp.base_employee_position_temp;
commit;