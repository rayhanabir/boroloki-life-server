const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const fileUpload = require("express-fileupload");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const port = process.env.port || 5000;

//middelware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.acq7h.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("boroloki_life");
    const servicesCollection = database.collection("services");
    const ordersCollection = database.collection("orders");
    const reviewCollection = database.collection("review");
    const usersCollection = database.collection("users");

              //all get api

    app.get("/services", async (req, res) => {
      const cursor = servicesCollection.find({});
      const result = await cursor.toArray(cursor);
      res.json(result);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.findOne(query);
      res.json(result);
    });

    //all data load
    app.get("/orders", async (req, res) => {
      const order = ordersCollection.find({});
      const result = await order.toArray();
      res.json(result);
    });

    //data load by particular email id
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const cursor = await ordersCollection
        .find({ CustomerEmail: email })
        .toArray();
      res.json(cursor);
    });

    //check user admin or not
    app.get('/users/:email', async(req, res)=>{
        const email = req.params.email;
        const filter = {email:email}
        const user = await usersCollection.findOne(filter);
        let isAdmin = false;
        if(user?.role ==="admin"){
          isAdmin = true
        }
        res.json({admin:isAdmin})
    })

      //review load 

      app.get('/reviews', async(req, res) =>{
        const review = reviewCollection.find({})
        const result = await review.toArray();
        res.json(result)
      })

            //all post method

    app.post("/services", async (req, res) => {
      const name = req.body.name;
      const price = req.body.price;
      const details = req.body.details;
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const service = {
        name,
        price,
        details,
        image: imageBuffer,
      };
      const result = await servicesCollection.insertOne(service);
      res.json(result);
    });

    //order send to db

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.json(result);
    });

    //review send to db
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.json(result);
    });

    //user send to db
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });

                // put function

    // if user log in using google btn then work it 

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // set admin in user

    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

        // set order  status 
    app.put('/orders/:id', async(req, res)=>{
      const id = req.params.id;
      const status = req.body.status;
      const filter = {_id:ObjectId(id)}
      const updateDoc = {$set:{status:status.toLowerCase()}}
      const result = await ordersCollection.updateOne(filter, updateDoc);
      if(!result.modifiedCount)return res.send({status:0,message:'update faild'})
      res.json({status:1, message:'update successful'});
    })

              //all delete api 
    
      app.delete("/orders/:id", async(req, res)=>{
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const result = await ordersCollection.deleteOne(query);
          res.json(result);
      })

      app.delete("/services/:id", async(req, res)=>{
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const result = await servicesCollection.deleteOne(query);
          res.json(result);
      })

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hey Luxury Life");
});

app.listen(port, () => {
  console.log(`port start on ${port}`);
});


