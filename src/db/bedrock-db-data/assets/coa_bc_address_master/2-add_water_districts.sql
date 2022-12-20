-- Update mrc and water_district
UPDATE internal.coa_bc_address_master
SET 
	mrc = water_districts.mrc,
	water_district = water_districts.mrc
FROM (
	SELECT DISTINCT
		internal.bc_location.location_id, 
		internal.coa_districts_water.mrc
	FROM
		internal.bc_location
	LEFT JOIN 
		internal.coa_districts_water
	ON
		st_contains(internal.coa_districts_water.shape,internal.bc_location.shape)
) AS water_districts 
WHERE internal.coa_bc_address_master.location_id = water_districts.location_id;
