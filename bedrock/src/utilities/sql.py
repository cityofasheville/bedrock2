import psycopg2
import pyodbc

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
            print("drivers: ")
            print(pyodbc.drivers())
            conn = pyodbc.connect(driver="ODBC Driver 17 for SQL Server",
                                  server=bedrock_connection["host"],
                                  database=bedrock_connection["database"],
                                  uid=bedrock_connection["username"],
                                  password=bedrock_connection["password"],
                                  port=1433,
                                  domain="ASHEVILLE")
            cursor = conn.cursor()
            cursor.execute('select top 10 * from amd.ad_info')
            print("I am here!")
            print(cursor)
            for row in cursor:
                print(row)
        except (Exception) as error:
            print(error)
        finally:
            if conn is not None:
                conn.close()
    else:
        print("Connection type " + bedrock_connection["type"] + " not yet implemented")
    return res
    
