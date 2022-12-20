




truncate table dbo.permit_review_times;
with 
main as (
	SELECT
	[RECORD_ID],[RECORD_NAME],[TASK],
	IIF([PROCESS_NAME] = 'DIV REVIEW-RES', 'Residential','Commercial') AS ResOrComm,	
	[RECORD_TYPE],
	[UPDATED_DATE], -- datetime that record was updated
	[DATE_STATUS],  -- date status change effective

	[STATUS]
	FROM [dbo].[V_WORKFLOW_HISTORY]
	where PROCESS_NAME in( 'DIV REVIEW-RES','DIVISION REVIEW')
	and TASK in ('Building Review') -- maybe expand to: ,'Zoning Review')
), 
firstdate as (
	select [RECORD_ID], MIN([UPDATED_DATE]) startdate  from main
	group by RECORD_ID
),
lastdate as (
	select [RECORD_ID], MIN([UPDATED_DATE]) enddate  from main
		  WHERE STATUS IN (
			'Approved',
			'Approved with Conditions',
			'Disapproved',
			'Hold for Revision'
	  )
	group by RECORD_ID
)
insert into dbo.permit_review_times(
            [RECORD_ID]
           ,[RECORD_NAME]
           ,[TASK]
           ,[ResOrComm]
           ,[RECORD_TYPE]
           ,[firststatus]
           ,[firststatusdate]
           ,[laststatus]
           ,[laststatusdate]
           ,[days]
           ,[yyyymm]
		   ,[completed])
-- completed		   
select first.[RECORD_ID],first.[RECORD_NAME],first.[TASK],first.ResOrComm,first.[RECORD_TYPE],first.[STATUS] firststatus, first.[DATE_STATUS] as firststatusdate, 
last.[STATUS] laststatus, last.[DATE_STATUS] as laststatusdate, datediff(DAY, first.[DATE_STATUS], last.[DATE_STATUS]) days,
convert(char(7), last.[DATE_STATUS],23) yyyymm, 1 as completed
from (
	select main.*, startdate from main
	inner join firstdate
	on main.RECORD_ID = firstdate.RECORD_ID
	and  main.[UPDATED_DATE] = firstdate.startdate
) as first
inner join (
	select main.*, enddate from main
	inner join lastdate
	on main.RECORD_ID = lastdate.RECORD_ID
	and  main.[UPDATED_DATE] = lastdate.enddate
) as last
on first.RECORD_ID = last.RECORD_ID

union
-- not completed as of today
select first.[RECORD_ID],first.[RECORD_NAME],first.[TASK],first.ResOrComm,first.[RECORD_TYPE],first.[STATUS] firststatus, first.[DATE_STATUS] as firststatusdate, 
last.[STATUS] laststatus, getdate() as laststatusdate, datediff(DAY, first.[DATE_STATUS], getdate()) days,
null as yyyymm, 0 as completed
from (
	select main.*, startdate from main
	inner join firstdate
	on main.RECORD_ID = firstdate.RECORD_ID
	and  main.[UPDATED_DATE] = firstdate.startdate
) as first
left join (
	select main.*, enddate from main
	inner join lastdate
	on main.RECORD_ID = lastdate.RECORD_ID
	and  main.[UPDATED_DATE] = lastdate.enddate
) as last
on first.RECORD_ID = last.RECORD_ID
where last.RECORD_ID is null