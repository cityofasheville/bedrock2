-- sql server
    select * into #temp_testtable from dbo.testtable where 1=2;

    -- (run stream)

    BEGIN TRANSACTION;  
    truncate table dbo.testtable;
    insert into dbo.testtable select * from #temp_testtable;
    COMMIT;

    drop table #temp_testtable;

    -- select *  from #temp_testtable;


-- postgres
    select * into temp temp_testtable from public.testtable where 1=2

    -- (run stream)

    BEGIN TRANSACTION;  
    truncate table public.testtable;
    insert into public.testtable select * from temp_testtable;
    commit;

    drop table temp_testtable

    --select *  from temp_testtable   
    --insert into temp_testtable select * from public.testtable