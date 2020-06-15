module.exports = {
  mdastore1: {
    name: 'MDAStore1',
    active: true,
    type: 'postgresql',
    description: 'Main managed data assets store',
  },
  coagiswarehouse1: {
    name: 'GIS Warehouse',
    active: true,
    type: 'postgresql',
    description: 'Main GIS Warehouse',
  },
  coagisedit: {
    name: 'GIS Edit DB',
    active: true,
    type: 'postgresql',
    description: 'City of Asheville GIS Edit Database',
  },
  munisdb: {
    name: 'Munis Database',
    active: true,
    type: 'sqlserver',
    description: 'Munis database',
  },
  acceladb: {
    name: 'Accela Database',
    active: true,
    type: 'sqlserver',
    description: 'Accela database',
  },
  everbridge: {
    name: 'Everbridge',
    active: true,
    type: 'service',
    description: 'Everbridge web service',
  },
  publicdb1: {
    name: 'PublicDB1',
    active: true,
    type: 'postgresql',
    description: 'COA Public DB',
  },
};
