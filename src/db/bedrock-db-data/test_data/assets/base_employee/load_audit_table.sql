START TRANSACTION;
    INSERT INTO standard.events_base_employee
    (changedfieldname, primkey, oldval, newval, changeddate)
    select * from standard.find_events('standard.base_employee' , 'temp.base_employee_temp' , 'employee_id' );
    truncate table standard.base_employee;
    insert into standard.base_employee
    select * from temp.base_employee_temp;
commit;