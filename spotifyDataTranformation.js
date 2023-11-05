require('dotenv').config()
var path = require('path');
const fs = require('fs');
const csvParser = require('csv-parser');
const args = process.argv.slice(2)
const { Client } = require('pg');
let artistsArray = [];
let tracksArray = [];
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, 
});

if(args.length === 0){
    console.log(`No artist and tracks CSV files provided`);
    process.exit()
}

for (let i = 0; i < args.length; i++){
    if(!path.parse(args[i]).ext){
        console.log(`No extention was provided for the file: ${path.parse(args[i]).name}`);
        process.exit()
    }
    else if(path.parse(args[i]).ext !== '.csv'){
        console.log(`This script only accepts CSV files`);
        process.exit()
    }
    else if(args.length > 2){
        console.log(`This script only accepts 2 files`);
         process.exit()
    }
    else if(args.length === 1){
        console.log(`No tracks CSV file provided`);
         process.exit()
    }
         fs.createReadStream(args[i])
        .pipe(csvParser())
        .on('data', (csvFileRowObject) => {
            if(i === 0){
              let artistGenres = csvFileRowObject.genres.split(', ')

              for (let index = 0; index < artistGenres.length; index++) {
               if(artistGenres[index][0] == `"` && artistGenres[index].at(-1) == `"` ){
                artistGenres[index] = `"${artistGenres[index]}"`
               }
               if(artistGenres[index].substring(0,2) == '["' && (artistGenres[index].at(-1) == `]` && artistGenres[index].at(-2) == `"`)){
                artistGenres[index] = `"[""${artistGenres[index].substring(2).slice(0,-1)}"]"`
               }
               else if(artistGenres[index][0] == `[` && artistGenres[index][1] == `"`){
                artistGenres[index] = `[""${artistGenres[index].substring(2)}"`
               }
               else if(artistGenres[index].at(-1) == `]` && artistGenres[index].at(-2) == `"`){
                artistGenres[index] = `"${artistGenres[index].slice(0,-1)}"]`
               }
            }
               if(artistGenres.length > 1){
                csvFileRowObject.genres = `"${artistGenres.join()}"`
               }
              else{
                csvFileRowObject.genres = artistGenres.join()
              }
            artistsArray.push(csvFileRowObject)
            }
            else{

              let songArtists = csvFileRowObject.artists.split(', ')

              for (let index = 0; index < songArtists.length; index++) {
               if(songArtists[index][0] == `"` && songArtists[index].at(-1) == `"` ){
                songArtists[index] = `"${songArtists[index]}"`
               }
               if(songArtists[index].substring(0,2) == '["' && (songArtists[index].at(-1) == `]` && songArtists[index].at(-2) == `"`)){
                songArtists[index] = `"[""${songArtists[index].substring(2).slice(0,-1)}"]"`
               }
               else if(songArtists[index][0] == `[` && songArtists[index][1] == `"`){
                songArtists[index] = `[""${songArtists[index].substring(2)}"`
               }
               else if(songArtists[index].at(-1) == `]` && songArtists[index].at(-2) == `"`){
                songArtists[index] = `"${songArtists[index].slice(0,-1)}"]`
               }
            }
                 if(songArtists.length > 1){
                 csvFileRowObject.artists = `"${songArtists.join()}"`
                 }
              else{
                csvFileRowObject.artists = songArtists.join()
              }
              tracksArray.push(csvFileRowObject)
            }
        })
        .on('end', () => {
            if(i === 1){
              filterTracks()
            }
          });
}

function filterTracks(){
  tracksArray = tracksArray.filter(track => track.name && track.duration_ms >= 60000);
  tracksArray = tracksArray.map(track => {
        let newIdArtists = track.id_artists.replace(/'/g, '"')
        newIdArtists = JSON.parse(newIdArtists)
        return { ...track, id_artists: newIdArtists };
      });
    filterArtists()
}

function filterArtists(){
    const artistIdsSet = new Set();
    tracksArray.forEach(track => {
      track.id_artists.forEach(artistId => {
        artistIdsSet.add(artistId);
      });
    });
    artistsArray = artistsArray.filter(artist => artistIdsSet.has(artist.id));
formatData()
}

function formatData(){
  tracksArray.forEach(track => {

    if(track.id_artists.length > 1){
      track.id_artists = `"['${track.id_artists.join(`','`)}']"`
    }
    else{
      track.id_artists = `['${track.id_artists.join(`','`)}']`
    }
    track.name = `"${track.name}"`;

        if (track.danceability >= 0.0 && track.danceability < 0.5) {
          track.danceability = `Low`;
        } else if (track.danceability >= 0.5 && track.danceability <= 0.6) {
          track.danceability = `Medium`;
        } else if (track.danceability > 0.6 && track.danceability <= 1) {
          track.danceability = `High`;
        }
    
        const trackReleaseDate = new Date(track.release_date);
        track.release_year = trackReleaseDate.getFullYear() || '';
        track.release_month = trackReleaseDate.getMonth() + 1 || '';
    
        if (!track.release_month) {
          track.release_day = '';
        } else {
          track.release_day = trackReleaseDate.getDate() || '';
        }
        delete track.release_date;
      });
      writeDataToCsvFile()
}

 function writeDataToCsvFile(){
  try{
    for (let i = 0; i < args.length; i++){
    const writeStream = fs.createWriteStream(`formated_${path.parse(args[i]).name}.csv`,'utf-8');
    let arrayToWrite = []
    if(i === 0){
        arrayToWrite = artistsArray
    }
    else{
        arrayToWrite = tracksArray
    }
const header = Object.keys(arrayToWrite[0]);
writeStream.write(header.join(',') + '\n');
arrayToWrite.forEach((object) => {
    const row = Object.values(object);
    writeStream.write(row.join(',') + '\n');
  });
  writeStream.end();
}
  }
  finally{
    setTimeout(() => {uploadCsvFilesToS3()},1000)
  }
}

function uploadCsvFilesToS3(){
  let uploadedFiles = 0
  for (let i = 0; i < args.length; i++){
  const fileContents = fs.readFileSync(`formated_${path.parse(args[i]).name}.csv`, 'utf8');
  const s3params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `formated_${path.parse(args[i]).name}.csv`,
    Body: fileContents,
  };
  
  s3.upload(s3params, (err, data) => {
    if (err) {
      console.error('Error uploading file:', err);
      process.exit()
    } else {
      uploadedFiles++
      console.log('File uploaded successfully. S3 Object URL:', data.Location);
      if(uploadedFiles == 2){
        getCsvFileDataFromS3()
        }
    }
  });
}
}

async function insertDataFromS3ToPostgreSQL(csvData) {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
  });
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    for (let i = 0; i < args.length; i++) {
      let insertErrorCount = 0;

      if (i === 0) {
        const query = `INSERT INTO artists (id, followers, genres, name, popularity) VALUES ($1, $2, $3, $4, $5)`;

        for (const artist of csvData[0]) {
          try {
            const res = await client.query(query, [
              artist.id,
              artist.followers,
              artist.genres,
              artist.name,
              artist.popularity,
            ]);
          } catch (err) {
            insertErrorCount++;
          }
        }
      } else if (i === 1) {
        const query = `INSERT INTO tracks (id, name, popularity, duration_ms, explicit, artists, id_artists, danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, time_signature, release_year, release_month, release_day) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`;

        for (const track of csvData[1]) {
          try {
            const res = await client.query(query, [
              track.id,
              track.name,
              track.popularity,
              track.duration_ms,
              track.explicit,
              track.artists,
              track.id_artists,
              track.danceability,
              track.energy,
              track.key,
              track.loudness,
              track.mode,
              track.speechiness,
              track.acousticness,
              track.instrumentalness,
              track.liveness,
              track.valence,
              track.tempo,
              track.time_signature,
              track.release_year,
              track.release_month,
              track.release_day,
            ]);
          } catch (err) {
            insertErrorCount++;
          }
        }
      }
      console.log(`done inserting formated_${path.parse(args[i]).name}.csv file data to the database`);
      if (insertErrorCount > 0) {
        console.log(`failed to insert ${insertErrorCount} rows`);
      }
    }
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
  } finally {
    client.end();
  }
}

function getCsvFileDataFromS3(){
  let csvData = [[],[]]
  for (let i = 0; i < args.length; i++){
  const s3params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `formated_${path.parse(args[i]).name}.csv`
  };
  s3.getObject(s3params).createReadStream()
  .pipe(csvParser())
  .on('data', (csvFileRowObject) => {
  if(i === 0){
    csvFileRowObject.genres = csvFileRowObject.genres.replace('[','{').replace(']', '}').replace('"{',"{").replace('}"','}')
    csvData[0].push(csvFileRowObject);
  }
  else if(i === 1){
  if(csvFileRowObject.artists && csvFileRowObject.id_artists){
    csvFileRowObject.artists = csvFileRowObject.artists.replace('[','{').replace(']', '}').replace('"{',"{").replace('}"','}')
    csvFileRowObject.id_artists = csvFileRowObject.id_artists.replace('[','{').replace(']', '}').replace('"{',"{").replace('}"','}')
  csvData[1].push(csvFileRowObject);
  }
}
})
.on('end', () => {
  if(i === 1){
    insertDataFromS3ToPostgreSQL(csvData)
  }
});
  }
}


  
