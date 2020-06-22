export default {
	"gtfs_stop_times": [
		{
			"name": "trip_id",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "arrival_time",
			"dataType": "time",
			"maxLength": 5,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "departure_time",
			"dataType": "time",
			"maxLength": 5,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "stop_id",
			"dataType": "varchar",
			"maxLength": 20,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "stop_sequence",
			"dataType": "smallint",
			"maxLength": 2,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "stop_headsign",
			"dataType": "varchar",
			"maxLength": 80,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "pickup_type",
			"dataType": "int",
			"maxLength": 4,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "drop_off_type",
			"dataType": "int",
			"maxLength": 4,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "shape_dist_traveled",
			"dataType": "float",
			"maxLength": 8,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "timepoint",
			"dataType": "bit",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "start_service_area_id",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "end_service_area_id",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "start_service_area_radius",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "end_service_area_radius",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "continuous_pickup",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "continuous_drop_off",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "pickup_area_id",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "drop_off_area_id",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "pickup_service_area_radius",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "drop_off_service_area_radius",
			"dataType": "varchar",
			"maxLength": 1,
			"options": {
				"nullable": true
			}
		}
	],
	"moo": [
		{
			"name": "dat",
			"dataType": "int",
			"maxLength": 4,
			"options": {
				"nullable": true
			}
		}
	],
	"telestaff_import_time": [
		{
			"name": "ID",
			"dataType": "int",
			"maxLength": 4,
			"options": {
				"nullable": false
			}
		},
		{
			"name": "source",
			"dataType": "varchar",
			"maxLength": 32,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "group",
			"dataType": "varchar",
			"maxLength": 32,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "emp_id",
			"dataType": "int",
			"maxLength": 4,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "pay_code",
			"dataType": "smallint",
			"maxLength": 2,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "date_worked",
			"dataType": "date",
			"maxLength": 3,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "hours_worked",
			"dataType": "decimal",
			"maxLength": 9,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "note",
			"dataType": "varchar",
			"maxLength": 128,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "date_time_from",
			"dataType": "datetime",
			"maxLength": 8,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "date_time_to",
			"dataType": "datetime",
			"maxLength": 8,
			"options": {
				"nullable": true
			}
		},
		{
			"name": "hours_calc",
			"dataType": "decimal",
			"maxLength": 9,
			"options": {
				"nullable": true
			}
		}
	]
}