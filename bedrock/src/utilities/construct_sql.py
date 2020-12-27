
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

def create_decimal_column(col, dbtype):
    if "precision" not in col:
        raise Exception("Decimal type requires a precision")
    return col["name"] + " DECIMAL(" + col["precision"] + ")"

def create_float_column(col, dbtype):
    res = col["name"] + " FLOAT"
    if "precision" in col:
        res = res + "(" + col["precision"] + ")"
    return res

def create_datetime_column(col, dbtype):
    if dbtype == 'postgresql':
        res = col["name"] + " timestamp without time zone"
    elif dbtype == 'sqlserver':
        res = col["name"] + " datetime"
    return res

def sql_column(col, is_last, dbtype):
    if col["type"] == "string":
        res = create_string_column(col, dbtype)
    elif col["type"] == "character":
        res = create_character_column(col, dbtype)
    elif col["type"] == "integer":
        res = create_integer_column(col, dbtype)
    elif col["type"] == "decimal":
        res = create_decimal_column(col, dbtype)
    elif col["type"] == "float":
        res = create_float_column(col, dbtype)
    elif col["type"] == "datetime":
        res = create_datetime_column(col, dbtype)
    else:
        return ""

    if not is_last:
        res = res + ",\n"
    return res

