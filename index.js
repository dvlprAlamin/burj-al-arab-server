const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors')
require('dotenv').config()
const app = express();
app.use(cors())
app.use(express.json());
const serviceAccount = require("./configs/burj-al-arab-99-firebase-adminsdk-9yr6g-a5e1a452c6.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: 'https://burj-al-arab-99.firebaseio.com'
});

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wlkn5.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("burjAlArab").collection("bookings");
  app.post('/addBookings', (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.get('/bookings', (req, res) => {
    const email = req.query.email;
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          if (tokenEmail === email) {
            collection.find({ email })
              .toArray((err, documents) => {
                res.send(documents)
              })
          }
          else{
            res.status(401).send('Unauthorized access');
          }
        })
        .catch((error) => {
          res.status(401).send('Unauthorized access');
        });
    }
    else{
      res.status(401).send('Unauthorized access');
    }
  })
});


const port = 4000;
app.listen(port)