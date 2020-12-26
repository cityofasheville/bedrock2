import psycopg2

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
