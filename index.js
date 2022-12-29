const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


// Database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.f3zh5ao.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(401).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    })
}

// All APIs
async function run() {
    try {
        const tasksCollection = client.db('task').collection('tasks');

        //JWT token get
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const user = usersCollection.findOne({ email: email });
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
                return res.send({ accessToken: token });
            }
            res.status(403).send('Unauthorized User');
        })

        //Tasks get
        app.get('/tasks', async (req, res) => {
            const type = req.query.type;
            const email = req.query.email;
            let query = { email: email };

            if (type === "completed") {
                query = { email: email, status: 1 }
            }

            if (type === "incompleted") {
                query = { email: email, status: 0 }
            }

            const tasks = await tasksCollection.find(query).toArray();
            res.send(tasks);
        })

        //Get specific task
        app.get('/task/:id', async (req, res) => {
            const id = req.params.id;
            let query = { _id: ObjectId(id) };

            const task = await tasksCollection.findOne(query);
            res.send(task);
        })

        //Task create
        app.post('/task', async (req, res) => {
            const task = await tasksCollection.insertOne(req.body);
            res.send(task);
        })

        //Task update
        app.put('/task/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = { $set: req.body }
            const result = await tasksCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //Task delete
        app.delete('/task/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await tasksCollection.deleteOne(query);
            res.send(result);
        })
    } finally {

    }
}
run().catch(e => console.error(e));

app.get('/', (req, res) => {
    res.send("Task manager server is running");
})

app.listen(port, () => console.log(`Server is running on port ${port}`));