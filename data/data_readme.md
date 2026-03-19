DOWNLOAD
download PostgreSQL: https://www.postgresql.org/download/
you can download pgAdmin4 for visualizing too: https://www.pgadmin.org/download/

------------------------------------------
CONFIG
somewhere in the .exe to setup, it asks for a password + port
i used the default port 5432 so its easier and made a password 12345 (lol)

rmb to add to PATH in sys env variables

----------------------------------------
on shell:

# connect to postgreqsl
psql -U postgres 

# it will prompt for a password, so enter it
(12345)

# now create the DB
CREATE DATABASE hooked;

# doing this lets the schema.sql file import into our PostgreSQL DB
# might have to check if u r in the right path/folder for the schema.sql file
psql -U postgres -d hooked -f schema.sql

# Check if tables were created
psql -U postgres -d hooked -c "\dt"

output should show something like:
           List of tables
 Schema |      Name       | Type  |  Owner
--------+-----------------+-------+----------
 public | albums          | table | postgres
 public | artists         | table | postgres
 public | friends         | table | postgres
 public | interactions    | table | postgres
 public | playlist_tracks | table | postgres
 public | playlists       | table | postgres
 public | song_artists    | table | postgres
 public | song_ratings    | table | postgres
 public | songs           | table | postgres
 public | user_profiles   | table | postgres
 public | users           | table | postgres

# add test data
psql -U postgres -d hooked -f data/add_test_data.sql