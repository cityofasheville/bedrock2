// This fakes reading data from S3 and just returns the expected metadata.

exports.handler = async function(event, context) {
  console.log(`Reading metadata from location ${event.AssetMetadataS3Location}.`);

  /**
   * This is an example structure for the metadata
   */
  return {
    "name": "Address Data ETL Jobs",
    "type": "standard",
    "runGroupCount": 2,
    "orderedRunGroups": [
      [
        {
          "name": "coa_active_jurisdictions.ms1",
          "url": "/store/assets/coa_active_jurisdictions.ms1/coa_active_jurisdictions.ms1.json",
          "tasks": [
            {
              "type": "noop"
            }
          ]
        }
      ],
      [
        {
          "name": "coa_bc_address_master",
          "url": "/store/assets/coa_bc_address_master/coa_bc_address_master.json",
          "tasks": [
            {
              "type": "sql",
              "file": "/store/assets/coa_bc_address_master/1-coa_bc_address_master_base.sql",
              "target_db": "datastore1"
            },
            {
              "type": "sql",
              "file": "/store/assets/coa_bc_address_master/2-add_water_districts.sql",
              "target_db": "datastore1"
            }
          ]
        }
      ]
    ]
  };
}
