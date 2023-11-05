# Telesoftas Junior Cloud Developer task

## Cloning the repository
Clone this repository and open the cloned reposetory in the terminal.
## Setting up a local PostgreSQL database
Download and install PostgreSQL to your machine using [this link](https://www.postgresql.org/download/). During the installation process you will create a PosgreSQL user. Remember this user's login information.

## Creating PostgreSQL database and tables
Once PostgreSQL is installed. Login to PosgreSQL by typing this command in the terminal:
 ```sh
psql -U postgreSQL_user
```
Replace postgreSQL_user with the user you created earlier.

Once you're logged in to PostgreSQL create a database using this command: 
 ```sh
CREATE DATABASE database_name;
```
Replace database_name with the name of the database you wish to create.
Now exit PostgreSQL (for example: using ctrl+c) and now we will created the needed tables for this project. there are two ways to create the needed table.
FIRST WAY:
This project contains a file called databaseTables.sql. You can create the required tables for this project by using this command: 
 ```sh
 psql -U postgreSQL_user -d database_name -f /path/to/databaseTables.sql
 ```
Just make sure to replace postgreSQL_user with the name of your PostgreSQL user and database_name with the name of the database you created. Replace /path/to/databaseTables.sql with the actual path to the databaseTables.sql file.

SECOND WAY:
Connect to your newly created database by using this command in the terminal:
 ```sh
psql -U postgreSQL_user -d database_name
```
Just make sure to replace postgreSQL_user with the name of your PostgreSQL user and database_name with the name of the database you created. 

Next create the tables using these commands:
 ```sh
CREATE TABLE artists (
    id text PRIMARY KEY,
    followers float,
    genres text[],
    name text,
    popularity integer
); 
```
 ```sh
CREATE TABLE tracks (
   id TEXT,
   name TEXT,
   popularity INTEGER,
   duration_ms INTEGER,
   explicit INTEGER,
   artists TEXT[],
   id_artists TEXT[],
   danceability TEXT,
   energy FLOAT,
   key INTEGER,
   loudness FLOAT,
   mode INTEGER,
   speechiness FLOAT,
   acousticness FLOAT,
   instrumentalness FLOAT,
   liveness FLOAT,
   valence FLOAT,
   tempo FLOAT,
   time_signature INTEGER,
   release_year INTEGER,
   release_month INTEGER,
   release_day INTEGER
);
```
## creating AWS user
Go to [this link](https://us-east-1.console.aws.amazon.com/iamv2/home?region=eu-north-1#/users) and create a user with "s3:PutObject" and "s3:GetObject" permissions. When the user is created click on it and create access key's for this user. When creating the access key's for the user choose the CLI option and when the access key's are create write down the access key and the secret access key.

## creating AWS S3 bucket
Go to [this link](https://s3.console.aws.amazon.com/s3/home?region=eu-north-1) and click the button "Create bucket". Next create the name for the bucket, set the bucket region to the region of your choise and make this bucket public.

## configuring .env file
Inside the project folder you will find a file named ".env". Open this file in a text editor. The file should look like this:
 ```sh
ACCESS_KEY=
SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
POSTGRES_HOST=
POSTGRES_PORT=
```
You need to change the values of the variables inside this file to the appropriate information that you got using the previous steps.
meaning of the values:
ACCESS_KEY - the AWS user's access key you got while creating the user's access key,
SECRET_ACCESS_KEY - the AWS user's secret access key you got while creating the user's access key,
AWS_REGION - the region you chose when creating the S3 bucket (for example: eu-north-1 ),
S3_BUCKET_NAME - the name of the S3 bucket,
POSTGRES_USER - the username of the user you used to connect to the PostgreSQL database,
POSTGRES_PASSWORD -  the password of the user you used to connect to the PostgreSQL database,
POSTGRES_DB - the name of the database you created in PostgreSQL,
POSTGRES_HOST - The name of the database host (for example: localhost ),
POSTGRES_PORT - the port your database uses (for example: 5432 ).

## Installing project dependencies
Open the project folder in the terminal and run the command:
```sh
npm i
```
## Running the node.js script
After all the dependencys of the project are installed, open the project folder in the terminal and run the node.js script that transforms the spotify data, by entering this command in the terminal:
```sh
node spotifyDataTransformation.js path/to/artists.csv/file path/to/tracks.csv/file
```
Be sure to replace the path/to/artists.csv/file argument with the path to the CSV file that contains the data of the artists.
Be sure to replace the path/to/tracks.csv/file argument with the path to the CSV file that contains the data of the tracks.

If by any chance you encounter memory issues try running this command instead:
```sh
node --max-old-space-size=4096 spotifyDataTransformation.js path/to/artists.csv/file path/to/tracks.csv/file
```
This script will read the data from the csv files, transform it, store the transformed data as a CSV file in a S3 bucket, read the data stored in the S3 bucket and insert this data to the PostgreSQL artists and tracks tables.
## Running the data processing sql script
The project contains a file called "spotifyDataAnalysis.sql".
Once the node.js script has finished you can run the "spotifyDataAnalysis.sql" file in order to process the data that is stored in the database.
To run the script, in the terminal, use this command:
```sh
psql -U postgreSQL_user -d database_name -a -f path/to/spotifyDataAnalysis.sql
```
Just make sure to replace postgreSQL_user with the name of your PostgreSQL user and database_name with the name of the database you created. Replace path/to/spotifyDataAnalysis.sql with the actual path to the spotifyDataAnalysis.sql file.

Once the script has execuded, log into PostgreSQL using this command:
 ```sh
psql -U postgreSQL_user -d database_name
```
Just make sure to replace postgreSQL_user with the name of your PostgreSQL user and database_name with the name of the database you created. 
Then run these 3 commands in order to see the results of the sql script:
 ```sh
SELECT * FROM track_info;
SELECT * FROM tracks_with_followers;
SELECT * FROM most_energizing_tracks;
```
track_info view stores the results of the task: "Take track: id, name, popularity, energy, danceability (Low, Medium, High); and number of artist followers".
tracks_with_followers view stores the results of the task: "Take only these tracks, which artists has followers".
And lastly most_energizing_tracks view stores the results of the task: "Pick the most energising track of each release year".