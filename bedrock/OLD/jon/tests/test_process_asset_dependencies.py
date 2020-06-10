grouped_assets= {}
rungrp = 1
grouped_assets[rungrp] = {
'bc_civicaddress_table.ms1': {
    'depends': [], 
    'name': 'bc_civicaddress_table.ms1', 
    'path': 'bc_civicaddress_table.ms1'}, 
'bc_location.ms1': {
    'depends': [], 
    'name': 'bc_location.ms1', 
    'path': 'bc_location.ms1'}, 
'bc_property.ms1': {
    'depends': [], 
    'name': 'bc_property.ms1', 
    'path': 'bc_property.ms1'}, 
'coa_bc_address_master': {
    'depends': ['bc_property.ms1','bc_property.ms1','bc_location.ms1','bc_civicaddress_table.ms1'], 
    'name': 'coa_bc_address_master', 
    'path': 'coa_bc_address_master'}
}
dependency_map = {}
for asset in grouped_assets[rungrp]:
    config = grouped_assets[rungrp][asset]
    depends = config['depends']
    dependency_map[asset] = {i for i in depends} 
print( 
    dependency_map
)

# print(
#     {i for i in list((map(lambda xx: grouped_assets[rungrp][xx]['depends'], grouped_assets[rungrp])))}
#     )

# fred = {i for i in map(lambda xx: grouped_assets[rungrp][xx]['depends'], grouped_assets[rungrp]) }
# print(fred)

# print( 
#     dict(zip(grouped_assets[rungrp], {x for x in map(lambda xx: grouped_assets[rungrp][xx]['depends'], grouped_assets[rungrp])} ))
# )
# print( list(map(lambda xx: dict(xx: x[xx]['depends']), x) ))

{'bc_civicaddress_table.ms1': [], 
'bc_location.ms1': [], 
'bc_property.ms1': [], 
'coa_bc_address_master': ['bc_property.ms1', 'bc_property.ms1', 'bc_location.ms1', 'bc_civicaddress_table.ms1']}



# i want this:
{'bc_civicaddress_table.ms1': {}, 
'bc_location.ms1': {}, 
'bc_property.ms1': {}, 
'coa_bc_address_master': {'bc_location.ms1', 'bc_civicaddress_table.ms1', 'bc_property.ms1'}
}