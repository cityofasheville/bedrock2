
-- Used to determine why inserts were failing
select 
max(len( permit_num ) ) as permit_num,
max(len( parcel_num ) ) as parcel_num,
max(len( permit_type ) ) as permit_type,
max(len( description ) ) as description,
max(len( permit_status ) ) as permit_status,
max(len( directions ) ) as directions,
max(len( lot ) ) as lot,
max(len( subdivision ) ) as subdivision,
max(len( total_sf ) ) as total_sf,
max(len( basement_heated_sf ) ) as basement_heated_sf,
max(len( basement_unheated_sf ) ) as basement_unheated_sf,
max(len( garage_carport_sf ) ) as garage_carport_sf,
max(len( total_heated_sf ) ) as total_heated_sf,
max(len( foundation ) ) as foundation,
max(len( units ) ) as units,
max(len( bedrooms ) ) as bedrooms,
max(len( type_of_heat ) ) as type_of_heat,
max(len( mh_year ) ) as mh_year,
max(len( mh_size ) ) as mh_size,
max(len( quantity ) ) as quantity,
max(len( basement_finished ) ) as basement_finished,
max(len( bathrooms ) ) as bathrooms,
max(len( note ) ) as note,
max(len( employee ) ) as employee,
max(len( active_flag ) ) as active_flag
from dbo._temp




