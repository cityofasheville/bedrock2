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
        "bedrock_type": "character"
    },
    "character varying": {
        "bedrock_type": "string"
    },
    "varchar": {
        "bedrock_type": "string"
    },
    "int": {
        "bedrock_type": "integer",
        "length": 4
    },
    "bigint": {
        "bedrock_type": "integer",
        "length": 8
    },
    "smallint": {
        "bedrock_type": "integer",
        "length": 2
    },
    "tinyint": {
        "bedrock_type": "integer",
        "length": 1
    },
    "bit": {
        "bedrock_type": "boolean"
    },
    "real": {
        "bedrock_type": "real",
        "length": 4
    },
    "float": {
        "bedrock_type": "real"
    },
    "numeric": {
        "bedrock_type": "decimal"
    },
    "decimal": {
        "bedrock_type": "decimal"
    },
    "datetime": {
        "bedrock_type": "datetime"
    },
    "date": {
        "bedrock_type": "date"
    },
    "time": {
        "bedrock_type": "time"
    },
    "binary": {
        "bedrock_type": "binary"
    },
    "varbinary": {
        "bedrock_type": "binary",
    }
}

pg_types = {
    "character": {
        "bedrock_type": "character"
    },
    "text": {
        "bedrock_type": "string"
    },
    "varchar": {
        "bedrock_type": "string",
        "alt": "text"
    },
    "character varying": {
        "bedrock_type": "string",
        "alt": "text"
    },
    "integer": {
        "bedrock_type": "integer",
        "length": 4
    },
    "int": {
        "bedrock_type": "integer",
        "length": 4
    },
    "bigint": {
        "bedrock_type": "integer",
        "length": 8
    },
    "smallint": {
        "bedrock_type": "integer",
        "length": 2
    },
    "boolean": {
        "bedrock_type": "boolean"
    },
    "real": {
        "bedrock_type": "real",
        "length": 4
    },
    "double precision": {
        "bedrock_type": "real",
        "length": 8
    },
    "numeric": {
        "bedrock_type": "decimal"
    },
    "decimal": {
        "bedrock_type": "decimal"
    },
    "timestamp without time zone": {
        "bedrock_type": "datetime"
    },
    "date": {
        "bedrock_type": "date"
    },
    "time": {
        "bedrock_type": "time"
    },
    "time without time zone": {
        "bedrock_type": "time"
    },
    "bytea": {
        "bedrock_type": "binary"
    },
    "USER-DEFINED": {
        "bedrock_type": "UNKNOWN"
    }
}



