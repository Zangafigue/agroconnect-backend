const { MongoClient } = require('mongodb');
require('dotenv').config();

async function test() {
  console.log('Testing connection to:', process.env.MONGODB_URI.replace(/:([^@]+)@/, ':****@'));
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('Success: Connected to MongoDB!');
    const dbs = await client.db().admin().listDatabases();
    console.log('Databases:', dbs.databases.map(db => db.name));
  } catch (err) {
    console.error('Error details:', err);
    if (err.reason) console.error('Reason:', err.reason);
  } finally {
    await client.close();
  }
}

test();
