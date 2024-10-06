import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';


const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

const uri = 'mongodb://hrTest:hTy785JbnQ5@mongo0.maximum.expert:27423/?authSource=hrTest&replicaSet=ReplicaSet&readPreference=primary';
const client = new MongoClient(uri);

let stockCollection;

client.connect().then(() => {
    console.log('Connected to MongoDB');
    const db = client.db('hrTest');
    stockCollection = db.collection('stock');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

app.get('/api/marks', async (req, res) => {
    try {
        const marks = await stockCollection.aggregate([
            {
                $group: {
                    _id: '$mark',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();
        res.json(marks);
        console.log(marks);
    } catch (error) {
        res.status(500).send('Error fetching marks');
    }
});

app.get('/api/models/:mark?', async (req, res) => {
    const { mark } = req.params;
    try {
        const models = await stockCollection.aggregate([
            { $match: { mark } },
            { $group: { _id: '$model' } }
        ]).toArray();
        res.json(models);
    } catch (error) {
        res.status(500).send('Error fetching models');
    }
});

app.get('/api/stock', async (req, res) => {
    const { mark, models, page = 1, limit } = req.query;
    const query = {};

    if (mark) {
        query.mark = mark;
    }

    if (models) {
        query.model = { $in: models.split(',') };
    }

    try {
        const cars = await stockCollection.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .toArray();
        res.json(cars);
    } catch (error) {
        res.status(500).send('Error fetching stock');
    }
});

app.listen(3000, () => {
    console.log(`Server running on http://localhost:3000`);
});
