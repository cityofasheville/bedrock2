bedrock_types = [
    "string",
    "character",
    "integer",
    "decimal",
    "real",
    "boolean",
    "datetime",
    "date",
    "time",
    "binary",
    "geometry"
]

ss_types = {
    "character": {
        "bedrock_type": "character",
        "default": True
    },
    "character varying": {
        "bedrock_type": "string",
        "default": False
    },
    "varchar": {
        "bedrock_type": "string",
        "default": True
    },
    "integer": {
        "bedrock_type": "integer",
        "length": 4,
        "default": True
    },
    "int": {
        "bedrock_type": "integer",
        "length": 4,
        "default": False
    },
    "bigint": {
        "bedrock_type": "integer",
        "length": 8,
        "default": False
    },
    "smallint": {
        "bedrock_type": "integer",
        "length": 2,
        "default": False
    },
    "bit": {
        "bedrock_type": "boolean",
        "default": True
    },
    "real": {
        "bedrock_type": "real",
        "length": 4,
        "default": True
    },
    "double precision": {
        "bedrock_type": "real",
        "length": 8,
        "default": False
    },
    "numeric": {
        "bedrock_type": "decimal",
        "default": True
    },
    "datetime": {
        "bedrock_type": "datetime",
        "default": True
    },
    "date": {
        "bedrock_type": "date",
        "default": True
    },
    "time": {
        "bedrock_type": "time",
        "default": true
    },
    "binary": {
        "bedrock_type": "binary",
        "default": true
    },
    "varbinary": {
        "bedrock_type": "binary",
        "default": true
    }
}

pg_types = {
    "character": {
        "bedrock_type": "character",
        "default": True
    },
    "text": {
        "bedrock_type": "string",
        "default": False
    },
    "varchar": {
        "bedrock_type": "string",
        "alt": "text",
        "default": True
    },
    "integer": {
        "bedrock_type": "integer",
        "length": 4,
        "default": True
    },
    "int": {
        "bedrock_type": "integer",
        "length": 4,
        "default": False
    },
    "bigint": {
        "bedrock_type": "integer",
        "length": 8,
        "default": False
    },
    "smallint": {
        "bedrock_type": "integer",
        "length": 2,
        "default": False
    },
    "bit": {
        "bedrock_type": "boolean",
        "default": True
    },
    "real": {
        "bedrock_type": "real",
        "length": 4,
        "default": True
    },
    "double precision": {
        "bedrock_type": "real",
        "length": 8,
        "default": False
    },
    "numeric": {
        "bedrock_type": "decimal",
        "default": True
    },
    "datetime": {
        "bedrock_type": "datetime",
        "default": True
    },
    "date": {
        "bedrock_type": "date",
        "default": True
    },
    "time": {
        "bedrock_type": "time",
        "default": true
    },
    "binary": {
        "bedrock_type": "binary",
        "default": true
    },
    "varbinary": {
        "bedrock_type": "binary",
        "default": true
    }
}

