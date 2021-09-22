
def create_string_column(col, dbtype):
    if "length" in col and col["length"] > 0:
        res = col["name"] + " VARCHAR(" + str(col["length"])+")"
    else:
        if dbtype == 'postgresql':
            res = col["name"] + " TEXT"
        elif dbtype == 'sqlserver':
            res = col["name"] + "VARCHAR(max)"
    return res

def create_character_column(col, dbtype):
    if "length" in col and col["length"] > 0:
        res = col["name"] + " CHARACTER(" + str(col["length"])+")"
    else:
        raise Exception("Length required for character type " + col["name"])
    return res

def create_integer_column(col, dbtype):
    res = col["name"] + " "
    if "length" in col and col["length"] != 4:
        if col["length"] == 2:
            res = res + "SMALLINT"
        else:
            res = res + "BIGINT"
    else:
        if dbtype == 'postgresql':
            res = res + "INTEGER"
        elif dbtype == 'sqlserver':
            res = res + "INT"
    return res

def create_bigint_column(col, dbtype):
    res = col["name"] + " BIGINT"
    return res

def create_smallint_column(col, dbtype):
    res = col["name"] + " SMALLINT"
    return res

def create_boolean_column(col, dbtype):
    res = col["name"] + " BOOLEAN"
    return res

def create_decimal_column(col, dbtype):
    if "precision" not in col:
        raise Exception("Decimal type requires a precision")
    return col["name"] + " DECIMAL(" + col["precision"] + ")"

def create_float_column(col, dbtype):
    res = col["name"] + " REAL"
    return res

def create_double_column(col, dbtype):
    res = col["name"] + " DOUBLE PRECISION"
    return res

def create_datetime_column(col, dbtype):
    if dbtype == 'postgresql':
        res = col["name"] + " timestamp without time zone"
    elif dbtype == 'sqlserver':
        res = col["name"] + " datetime"
    return res

def sql_column(col, is_last, dbtype):
    res = ""
    if col["type"] == "string":
        res = create_string_column(col, dbtype)
    elif col["type"] == "character":
        res = create_character_column(col, dbtype)
    elif col["type"] == "integer":
        res = create_integer_column(col, dbtype)
    elif col["type"] == "bigint":
        res = create_bigint_column(col, dbtype)
    elif col["type"] == "smallint":
        res = create_smallint_column(col, dbtype)
    elif col["type"] == "boolean":
        res = create_boolean_column(col, dbtype)
    elif col["type"] == "decimal":
        res = create_decimal_column(col, dbtype)
    elif col["type"] == "float":
        res = create_float_column(col, dbtype)
    elif col["type"] == "double":
        res = create_double_column(col, dbtype)
    elif col["type"] == "datetime":
        res = create_datetime_column(col, dbtype)

    if "nullable" in col and not col["nullable"]:
        res = res + " NOT NULL"

    if not is_last:
        res = res + ",\n"
    return res

def get_table_info_sql(bedrock_connection, schema, table):
    sql = """
        SELECT 
            COLUMN_NAME as column_name,
            IS_NULLABLE as is_nullable,
            DATA_TYPE as data_type,
            CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
            NUMERIC_PRECISION as numeric_precision,
            NULL as numeric_precision_radix,
            NUMERIC_SCALE as numeric_scale,
            ORDINAL_POSITION as ordinal_position
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '"""
    sql = sql + table + "' AND TABLE_SCHEMA = '" + schema + "' ORDER BY ORDINAL_POSITION ASC"
    return sql

