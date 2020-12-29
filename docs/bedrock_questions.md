# Bedrock Questions

## What is the purpose of Bedrock?

The purpose of the Bedrock system is to support the strategic use of data. In particular, the system attempts to automate as much as possible maintaining an up-to-date inventory of strategic data assets and their dependencies, maintaining up-to-date versions of the data itself (which often comes out of administrative systems), and supporting access both to the data and to information about it (metadata).

### What data is Bedrock responsible for?

Bedrock focuses on two types of data:

 - Data that we want to manage as strategic assets for reporting or performance management
 - Data that is used for integrating systems

What these two types have in common is a need for a managed interface between the systems or processes that generate the data and those that make use of it. As much as possible, systems that use the data should be able to remain ignorant of the details of how it is extracted or maintained, other than what is captured in metadata to support its use.

In the particular case of an application database (whether the application is third-party or custom), this means that the dependencies between Bedrock and data in that database lie only in the views/APIs provided by those systems for data extraction and any additional processing that needs to be done to conform the data to our internal standards or needs. Bedrock is not responsible for the maintenance of those views or for the application database itself, but it does provide the standard to which extracted data must conform. Bedrock becomes _responsible_ for the particular dataset only after it has been extracted and transformed.

In the case of Google sheets, the interface is effectively a contract between Bedrock and the people, process or system that maintains the spreadsheet.

## What is the data library?

_Data library_ refers to the central database (or set of databases) that are used to store tables maintained for use in reporting and integration. The library is _not_ the same thing as the set of all data assets managed by Bedrock (e.g., including spreadsheets). Such a central _listing_ of all assets is called a _data catalog_.

## How do the schemas of the data library get created?

The boundary between “infrastructure” and “application” becomes fuzzy when both are defined by code to be executed, but it is important to specify a boundary since they involve distinct approaches and roles. This is one of those fuzzy boundaries where we need to make a decision.

Our convention is that the database server, database, roles and schemas are all created from the infrastructure side. However, the requirements and definitions of the last two belong to the application (i.e., the application is the sole source of truth about what those roles and schemas should be).

_Note:_  The term “schema” is sometimes used to refer to table definitions as well as larger groupings of tables. In this document “schema” is used only in the Postgres meaning of a defined section of a database within which tables are defined.

## How do the tables of the data library get created?

The creation of tables, views and functions in the database fall on the other side of the infrastructure/application line: the application is responsible for creating them. This is true for all applications, but there are some additional considerations for Bedrock.

Assuming the data asset is not a spreadsheet, which must be created in advance, the tables are created as part of the process of creating an asset. More generally, we need to design a procedure for creating a new data asset to be managed by Bedrock that accomplishes the following:

 - Fill out all required metadata fields (we need to establish which those are, possibly differentially for integration assets and reporting assets, and put in a compliance check).
 - Create a description (schema) of the columns of the asset or associate it with existing blueprints. In the case of a DB table, the information should be sufficient to create the table automatically. For other assets such as Google sheets or files, it is useful for performing validation.
 - Run the Bedrock command to create the associated tables or views, if necessary
 - Configure any ETL tasks that are associated with the asset.

### How are these backed up? What is the DR plan?

Bedrock is unique in that it could not only recreate the tables associated with assets it manages, but could also re-generate the data by re-running all the ETL jobs. That is _not_, however, our approach to DR. Rather, as with any application, we will run regular backups and do any restores (including a full rebuild of the database) from those backups. 

The reason this is important is that it lets us restore the data library without worrying about dependency on any of the systems from which data is imported, or even the availability of the Bedrock ETL systems.

## How does Bedrock manage data standards?

Every asset in a DB or spreadsheet should include the name of a _blueprint_ file which defines the columns associated with the asset in sufficient detail to allow the asset to be recreated or validated. The blueprint file itself is stored in the blueprints subdirectory at the top level of the managed-data-assets repository. Note that the naming convention for blueprint files should allow for multiple different versions of the same blueprint to coexist. More than one asset may share a single blueprint.

These blueprints are _de facto_ data standards. We may wish to include metadata in the standard file noting the “level” of standard, i.e., is this just describing a single asset and is not expected to be used outside of that, or is this a COA official standard that multiple systems may depend on, or is it an externally defined standard (with some possible extensions)?

## Does Bedrock handle data standards for things it does not manage? 

_Example: a schema is in the same DB instance as other managed assets, because that is not where all of our production schemas live, but it is managed by the application, but not considered to be of value as a managed asset. Certain web applications would fall in this category or at least have tables in this category._

I think the answer here is no. Any application may choose to use data that conforms to a standard that is maintained in Bedrock and there may be things we can do to support it, but otherwise Bedrock would treat data in a custom application exactly the same way it would data of a third-party application that doesn’t allow us to control internal data standards.

## How does Bedrock handle assets that consist of multiple artifacts?

_Example: an employee record that consists of multiple tables in a DB that can be joined on employee ID._

In Bedrock an “asset” is the most granular artifact in the system, but multiple assets may be part of a single group. In order to make practical use of the group, of course, we need to be able to identify which other assets are in the group and what field we can join on (while there could be multiple, in principle, we will limit to one for the time being).

Grouping is associated with the blueprint, rather than with the assets themselves, and so should be defined there. Although it involves a bit of repetition of information, we will simply include the group information (name plus join-column) in every blueprint of the group.

Specifically, every blueprint file that is part of a group will contain a field (structure) called _blueprint_group_ consisting of a _blueprint_name_ and a _join_column_name_. The latter must be identically named in every member of the group. 

Obviously consolidating information about the group into an easily referenced form needs to be part of the preprocessing.

## Other questions

 - One way to validate the success of an ETL job is to check that the right number of records has been copied. Do we want to have some sort of ASSERTION syntax on an ETL job as a check? For example, if we expect at least 22,000 records, a transfer of only 10,000 would be flagged as an error.
