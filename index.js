const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors({
  origin: [
      'http://localhost:5173',
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ikoswdf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares 
const logger = (req, res, next) =>{
  console.log('log: info', req.method, req.url);
  next();
}

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // no token available 
  if(!token){
      return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
      if(err){
          return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decoded;
      next();
  })
}





async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const postjobCollection = client.db("courseDB").collection('allpostJob')
    const bidjobCollection = client.db("courseDB").collection('allbidJob')

         // auth related api
         app.post('/jwt', logger, async (req, res) => {
          const user = req.body;
          console.log('user for token', user);
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });

          res.cookie('token', token, {
              httpOnly: true,
              secure: true,
              sameSite: 'none'
          })
              .send({ success: true });
      })

      app.post('/logout', async (req, res) => {
          const user = req.body;
          console.log('logging out', user);
          res.clearCookie('token', { maxAge: 0 }).send({ success: true })
      })

      //  booking job


      app.get('/allbookingjob', logger, verifyToken, async (req, res) => {
        console.log(req.query.email);
        console.log('token owner info', req.user)
        if(req.user.email !== req.query.email){
            return res.status(403).send({message: 'forbidden access'})
        }
       let query = {};
        if (req.query?.email) {
            query = { email: req.query.email }
        }
        const result = await bidjobCollection.find(query).toArray();
        res.send(result);
    })

      app.post('/bookingjob', async (req, res) => {
        const booking = req.body;
        console.log(booking);
        const result = await bidjobCollection.insertOne(booking);
        res.send(result);
    });

    app.get('/bookingjob' ,async(req ,res ) =>{
      const cursor = bidjobCollection.find()
      const result = await cursor.toArray()
      res.send(result)
  })


   
    // post job

      app.get('/allpostJob', logger, verifyToken, async (req, res) => {
          console.log(req.query.email);
            console.log('token info', req.user)
            if(req.user.email !== req.query.email){
                return res.status(403).send({message: 'forbidden access'})
            }

        let query = {};
        if (req.query?.email) {
            query = { email: req.query.email }
        }
        const result = await postjobCollection.find(query).toArray();
        res.send(result);
    })



    app.get('/postJob' ,async(req ,res ) =>{
      const cursor = postjobCollection.find()
      const result = await cursor.toArray()
      res.send(result)
  })

  app.get("/postJob/:id" ,async(req , res ) =>{
    const id = req.params.id 
    const query = { _id: new ObjectId(id)}
    const result =await postjobCollection.findOne(query)
    res.send(result)
})
  app.get("/bookingjob/:id" ,async(req , res ) =>{
    const id = req.params.id 
    const query = { _id: new ObjectId(id)}
    const result =await bidjobCollection.findOne(query)
    res.send(result)
})



       app.post('/allpostJob' , async(req,res) =>{
      const newjob = req.body
      console.log(newjob);
      const result = await postjobCollection.insertOne(newjob)
      res.send(result)
  })




  // post method
 

// update method 

app.put("/postJob/:id" ,async(req , res ) =>{
  const id = req.params.id 
  const filter = { _id: new ObjectId(id)}
  const options = { upsert: true}
  const updatedjobs = req.body
  const jobs = {
      $set : {
          email: updatedjobs.email ,
          title: updatedjobs.title ,
          deadline: updatedjobs.deadline ,
          Minimumprice: updatedjobs.Minimumprice ,
          Maximumprice: updatedjobs.Maximumprice,
          description: updatedjobs.description ,
          category: updatedjobs.category
      }
  }
  const result =await postjobCollection.updateOne(filter , jobs , options)
  res.send(result)
})

app.patch('/bookingjob/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedBooking = req.body;
  console.log(updatedBooking);
  const updateDoc = {
      $set: {
          status: updatedBooking.status
      },
  };
  const result = await bidjobCollection.updateOne(filter, updateDoc);
  res.send(result);
})



// delete method
    app.delete("/postJob/:id" ,async(req , res ) =>{
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const result =await postjobCollection.deleteOne(query)
        res.send(result)
    })
    app.delete("/bookingjob/:id" ,async(req , res ) =>{
      const id = req.params.id 
      const query = {_id: new ObjectId(id)}
      const result =await bidjobCollection.deleteOne(query)
      res.send(result)
  })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



+
app.get('/', (req, res) => {
  res.send('online is busy marketing')
})

app.listen(port, () => {
  console.log(`online marketplace server is running on port: ${port}`);
})