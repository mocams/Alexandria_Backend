const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// To Avoid Cors Problems
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, x-auth-token, X-Requested-With, Accept');
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use('/api/books',require('./routes/api/books'))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


const connectToMongoDatabase = async () => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const uri = "mongodb+srv://camaramohamed2361:CrAfTET2n1GbeniE@cluster0.tav59.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB!");
  } 
  catch(err)
  {
    console.error("MongoDB connection error:", err);
  }
}

connectToMongoDatabase();