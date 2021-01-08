CREATE DATABASE ss1;
GO
USE ss1;
GO

create table testtable (
a float null,
b char(12) null,
c datetime null,
d date null );
GO

insert into testtable(a,b,c,d) values (
1,
'Some data',
'2020-06-25T00:22:44.100Z',
'2020-05-25'
),(
1.2,
null,
'2020-06-25T00:22:44.100Z',
'2020-05-25'
),(
null,
'text here',
null,
null
),(
777.777,
'lol wut',
null,
'9999-12-31'
);