truncate internal.coa_bc_address_master;

insert into internal.coa_bc_address_master (
  objectid,
  civicaddress_id,
  address_x,
  address_y,
  address_full,
  longitude_wgs,
  latitude_wgs,
  address_number,
  address_unit,
  unit_type,
  address_street_prefix,
  address_street_name,
  address_street_type,
  address_street_postdirection,
  address_city,
  address_commcode,
  address_zipcode,
  location_type,
  address_change_date,
  maximo_type,
  maximo_seq_num,
  asset_code,
  jurisdiction_type,
  centerline_id,
  location_id,
  parent_location_id,
  property_pinnum,
  property_pin,
  property_pinext,
  property_nmptype,
  property_oldpinnum,
  property_update_date,
  property_update_reason,
  property_deeddate,
  property_taxyear,
  property_deedurl,
  property_platurl,
  property_propcardurl,
  property_acreage,
  property_class,
  property_improved,
  property_exempt,
  property_priced,
  property_totalmarketvalue,
  property_appraisedvalue,
  property_taxvalue,
  property_landuse,
  property_neighborhoodcode,
  property_landvalue,
  property_buildingvalue,
  property_improvementvalue,
  property_appraisalarea,
  property_condounit,
  property_condobuilding,
  property_subname,
  property_sublot,
  property_subblock,
  property_subsect,
  property_township,
  property_stamps,
  property_instrument,
  property_firedistrict,
  property_schooldistrict,
  owner_name,
  owner_house_number,
  owner_number_suffix,
  owner_direction,
  owner_street_name,
  owner_street_type,
  owner_careof,
  owner_address,
  owner_cityname,
  owner_state,
  owner_zipcode,
  owner_account_number,
  shape
)
  SELECT DISTINCT
        address_locations.objectid,
        address_locations.civicaddress_id,
        address_locations.address_x,
        address_locations.address_y,
        address_locations.address_full,
        ST_X(ST_TRANSFORM(address_locations.shape,4326)) AS longitude_wgs,
        ST_Y(ST_TRANSFORM(address_locations.shape,4326)) AS latitude_wgs,
        address_locations.address_number,
        address_locations.address_unit,
        address_locations.unit_type,
        address_locations.address_street_prefix,
        address_locations.address_street_name,
        address_locations.address_street_type,
        address_locations.address_street_postdirection,
        internal.coa_zip_code.po_name as address_city,
        address_locations.address_commcode,
        address_locations.address_zipcode,
        address_locations.location_type,
        address_locations.address_change_date,
        'ADDR'::text as maximo_type,
        address_locations.civicaddress_id::int as maximo_seq_num,
        ('ADDR' || address_locations.civicaddress_id::int ) as asset_code,
        CASE
                WHEN active_jurisdictions.jurisdiction_type IS NULL
                THEN 'Buncombe County'
                ELSE active_jurisdictions.jurisdiction_type
        END,
        address_locations.centerline_id::bigint as centerline_id,
        address_locations.location_id as location_id,
        address_locations.parent_location_id as parent_location_id,
        internal.bc_property.pinnum as property_pinnum,
        internal.bc_property.pin as property_pin,
        internal.bc_property.pinext as property_pinext,
        internal.bc_property.nmptype as property_nmptype,
        internal.bc_property.oldpinnum as property_oldpinnum,
        internal.bc_property.updatedate as property_update_date,
        internal.bc_property.reason as property_update_reason,
        internal.bc_property.deeddate as property_deeddate,
        internal.bc_property.taxyear as property_taxyear,
        internal.bc_property.deedurl as property_deedurl,
        internal.bc_property.platurl as property_platurl,
        internal.bc_property.propcard as property_propcardurl,
        internal.bc_property.acreage as property_acreage,
        internal.bc_property.class as property_class,
        internal.bc_property.improved as property_improved,
        internal.bc_property.exempt as property_exempt,
        internal.bc_property.priced as property_priced,
        internal.bc_property.totalmarketvalue as property_totalmarketvalue,
        internal.bc_property.appraisedvalue as property_appraisedvalue,
        internal.bc_property.taxvalue as property_taxvalue,
        internal.bc_property.landuse as property_landuse,
        internal.bc_property.neighborhoodcode as property_neighborhoodcode,
        internal.bc_property.landvalue as property_landvalue,
        internal.bc_property.buildingvalue as property_buildingvalue,
        internal.bc_property.improvementvalue as property_improvementvalue,
        internal.bc_property.appraisalarea as property_appraisalarea,
        internal.bc_property.condounit as property_condounit,
        internal.bc_property.condobuilding as property_condobuilding,
        internal.bc_property.subname as property_subname,
        internal.bc_property.sublot as property_sublot,
        internal.bc_property.subblock as property_subblock,
        internal.bc_property.subsect as property_subsect,
        internal.bc_property.township as property_township,
        internal.bc_property.stamps as property_stamps,
        internal.bc_property.instrument as property_instrument,
        internal.bc_property.firedistrict as property_firedistrict,
        internal.bc_property.schooldistrict as property_schooldistrict,
        internal.bc_property_pinnum_formatted_owner_names.formatted_owner_name as owner_name,
        internal.bc_property.housenumber as owner_house_number,
        internal.bc_property.numbersuffix as owner_number_suffix,
        internal.bc_property.direction as owner_direction,
        internal.bc_property.streetname as owner_street_name,
        internal.bc_property.streettype as owner_street_type,
        internal.bc_property.careof as owner_careof,
        internal.bc_property.address as owner_address,
        internal.bc_property.cityname as owner_cityname,
        internal.bc_property.state as owner_state,
        internal.bc_property.zipcode as owner_zipcode,
        internal.bc_property.accountnumber as owner_account_number,
        address_locations.shape
FROM
--Address attributes and the locations
(
        -- Combine the bc_civic_address_table atrribute data with address locations stored in bc_location
        SELECT DISTINCT
                row_number() over () as objectid,
                internal.bc_civicaddress_table.civicaddress_id::int as civicaddress_id,
                internal.bc_location.x_coord as address_x,
                internal.bc_location.y_coord as address_y,
                internal.bc_location.locationtype as location_type,
                internal.bc_civicaddress_table.full_civic_address as address_full,
                internal.bc_civicaddress_table.street_number as address_number,
                internal.bc_civicaddress_table.unit as address_unit,
                internal.bc_civicaddress_table.unit_type as unit_type,
                internal.bc_civicaddress_table.street_prefix as address_street_prefix,
                internal.bc_civicaddress_table.street_name as address_street_name,
                internal.bc_civicaddress_table.street_type as address_street_type,
                internal.bc_civicaddress_table.street_postdirection as address_street_postdirection,
                internal.bc_civicaddress_table.commcode as address_commcode,
                internal.bc_civicaddress_table.postal_code as address_zipcode,
                internal.bc_civicaddress_table.change_date as address_change_date,
                internal.bc_location.centerline_id::bigint as centerline_id,
                internal.bc_civicaddress_table.location_id as location_id,
                CASE
                        WHEN internal.bc_location.parent_location_id = 0
                        THEN NULL
                        ELSE internal.bc_location.parent_location_id
                END,
                internal.bc_civicaddress_table.pinext as pinext,
                internal.bc_location.shape as shape
        FROM
                internal.bc_civicaddress_table
        LEFT JOIN
                internal.bc_location
        ON
                internal.bc_civicaddress_table.location_id = internal.bc_location.location_id
        WHERE internal.bc_civicaddress_table.civicaddress_id != 0
) as address_locations
-- Get the pin from bc_property spatially if an address location is contained by the property boundary.
-- (The parcel_id field in bc_location should be the same is the pin in bc_property, but is not consistent, 
-- so we need to use the pin from bc_property instead. )
-- 5/20/2018: adding the row_number() bit to pick only the first, if there are multiple matches. Due to an
-- error at the County, there were a couple properties overlapping other properties. Note that there WILL
-- be multiple matches in the below BECAUSE of the row_number() - all matches with same pin, different pinext.
-- To test whether there are actual errors, delete the row_number() and see if there are distinct pins for the
-- same location_id (this is a validation test in the bc_property MDA).
LEFT JOIN
(
        SELECT location_id, pin, rn from (
                SELECT DISTINCT
                        internal.bc_location.location_id,
                        internal.bc_property.pin,
                        row_number() over (partition by location_id ORDER BY pin) as rn
                FROM
                        internal.bc_location
                LEFT JOIN
                        internal.bc_property
                ON
                        st_contains(internal.bc_property.shape,internal.bc_location.shape)
        ) AS tmp WHERE rn = 1
) as property_location -- 133258 rows retrieved, 102508 distinct pins
ON
        address_locations.location_id = property_location.location_id
-- Get property attributes: Use the pin and pinext join bc_property to the address locations
LEFT JOIN
        internal.bc_property
ON
        property_location.pin = bc_property.pin
        AND
        address_locations.pinext = bc_property.pinext
-- Get the property owners name with proper formatting: Use the pin and pinext join bc_property_pinnum_formatted_owner_names to the address locations
LEFT JOIN
        internal.bc_property_pinnum_formatted_owner_names
ON
        property_location.pin ||  address_locations.pinext = internal.bc_property_pinnum_formatted_owner_names.pinnum
-- Get the address city name from the zip code table
LEFT JOIN
        internal.coa_zip_code
ON
        address_locations.address_zipcode = internal.coa_zip_code.zip::int
-- Get jurisdication information for an address location
-- (See CASE statement in SELECT statement above for more details.)
LEFT JOIN
(
        SELECT DISTINCT
                internal.bc_location.location_id,
                internal.coa_active_jurisdictions.jurisdiction_type
        FROM
                internal.bc_location
        LEFT JOIN
                internal.coa_active_jurisdictions
        ON
                st_contains(internal.coa_active_jurisdictions.shape,internal.bc_location.shape)
) as active_jurisdictions
ON
        address_locations.location_id = active_jurisdictions.location_id
order by objectid asc;
