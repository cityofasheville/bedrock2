## LoadFiles

This is a utility to create managed-data-assets json files from database tables.
Not used in the running of the program, but useful for backing it up. The created files can then be restored to the database with load_assets, (which is the same as the command ```make seed```.)

Set the parameters in the file ```/src/make_variables```, both the database and the directory where the files are to go can be set.
Run it with the command ```make local```