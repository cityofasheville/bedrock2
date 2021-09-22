import psycopg2
import pymssql

def execute_sql_statement(bedrock_connection, sql):
    conn = None

    if bedrock_connection["type"] == "postgresql":
        try:
            conn = psycopg2.connect(
                host=bedrock_connection["host"],
                database=bedrock_connection["database"],
                user=bedrock_connection["username"],
                password=bedrock_connection["password"]
            )
            cur = conn.cursor()
            cur.execute(sql)
            cur.close()
            conn.commit()
            conn.close()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
    else:
        print("Connection type " + bedrock_connection["type"] + " not yet implemented")

def execute_sql_statement_with_return(bedrock_connection, sql):
    res = None
    if bedrock_connection["type"] == "postgresql":
        try:
            conn = psycopg2.connect(
                host=bedrock_connection["host"],
                database=bedrock_connection["database"],
                user=bedrock_connection["username"],
                password=bedrock_connection["password"]
            )
            cur = conn.cursor()
            cur.execute(sql)
            res = cur.fetchall()
            cur.close()
            conn.commit()
            conn.close()
        except (Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
    elif bedrock_connection["type"] == "sqlserver":
        try:
            conn = pymssql.connect(host=bedrock_connection["host"],
                                  database=bedrock_connection["database"],
                                  user=bedrock_connection['domain'] + '\\' + bedrock_connection['username'],
                                  password=bedrock_connection["password"])
            cursor = conn.cursor()
            cursor.execute(sql)
            res = cursor.fetchall()
        except (Exception) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
    else:
        print("Connection type " + bedrock_connection["type"] + " not yet implemented")
    return res
    
