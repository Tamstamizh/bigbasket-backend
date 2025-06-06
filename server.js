// server.js - Simple Node.js Express Backend Server (with MongoDB)

// தேவையான தொகுதிகளை (modules) இறக்குமதி செய்யவும்
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // mongodb டிரைவரிலிருந்து MongoClient மற்றும் ObjectId ஐ இறக்குமதி செய்யவும்

// Express அப்ளிகேஷனை உருவாக்கவும்
const app = express();
const PORT = process.env.PORT || 3001; // சர்வர் இயங்கும் போர்ட் (போர்ட் 3001 அல்லது சுற்றுச்சூழல் மாறியிலிருந்து)

// --- MongoDB இணைப்பு அமைப்பு ---
// 'mongodb://localhost:27017' என்பதை உங்கள் MongoDB இணைப்பு சரத்துடன் மாற்றவும் (கிளவுட் அல்லது உள்ளூர்)
// நீங்கள் MongoDB Atlas (கிளவுட்) பயன்படுத்தினால், உங்கள் இணைப்பு சரத்தை இங்கே ஒட்டவும்.
// MongoDB Atlas இலிருந்து நீங்கள் Copy செய்த சரியான Connection String ஐ இங்கே உள்ளிடவும்.
// <db_password> என்பதற்குப் பதிலாக உங்கள் உண்மையான கடவுச்சொல்லை (Tamizh@4596) உள்ளிடவும்.
const MONGODB_URI = 'mongodb+srv://Tamizh:Tamizh@4596@tharshan.ix4q119.mongodb.net/?retryWrites=true&w=majority&appName=THARSHAN'; // <--- இந்த வரியை நீங்கள் புதுப்பிக்க வேண்டும்!
const DB_NAME = 'bigbasket_clone'; // உங்கள் தரவுத்தளத்தின் பெயர்
const COLLECTION_NAME = 'products'; // தயாரிப்புகளுக்கான உங்கள் கலெக்ஷனின் பெயர்

let db; // தரவுத்தள இணைப்பைப் பிடிக்கும் மாறி

// MongoDB உடன் இணைக்க ஒரு செயல்பாடு
async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect(); // MongoDB சர்வர் உடன் இணைக்கவும்
        db = client.db(DB_NAME); // தரவுத்தள இன்ஸ்டன்ஸ் ஐப் பெறவும்
        console.log(`MongoDB உடன் வெற்றிகரமாக இணைக்கப்பட்டது: ${MONGODB_URI}`);
        console.log(`தரவுத்தளம் பயன்படுத்தப்படுகிறது: ${DB_NAME}`);
    } catch (error) {
        console.error('MongoDB உடன் இணைக்க முடியவில்லை:', error);
        process.exit(1); // தரவுத்தளத்துடன் இணைக்க முடியாவிட்டால் செயல்முறையை வெளியேறவும்
    }
}

// சர்வர் தொடங்கும் போது MongoDB உடன் இணைக்கவும்
connectToMongoDB();

// --- மிடில்வேர் (Middleware) ---
app.use(express.json()); // JSON கோரிக்கை உடல்களைப் பார்ஸ் செய்ய
app.use(cors()); // CORS கொள்கைகளை அனுமதிக்க (முன்பக்க அப்ளிகேஷனில் இருந்து கோரிக்கைகளை அனுமதிக்க)

// --- API ரூட்டுகள் ---

// அனைத்து தயாரிப்புகளையும் MongoDB இலிருந்து பெற GET கோரிக்கை
// URL: /api/products
app.get('/api/products', async (req, res) => {
    console.log('GET /api/products கோரிக்கை பெறப்பட்டது.');
    try {
        const productsCollection = db.collection(COLLECTION_NAME);
        const products = await productsCollection.find({}).toArray(); // அனைத்து தயாரிப்புகளையும் பெறவும்
        res.json(products);
    } catch (error) {
        console.error('தயாரிப்புகளைப் பெறுவதில் பிழை:', error);
        res.status(500).json({ message: 'தரவுத்தளத்திலிருந்து தயாரிப்புகளைப் பெற முடியவில்லை.' });
    }
});

// MongoDB இல் புதிய தயாரிப்பைச் சேர்க்க POST கோரிக்கை
// URL: /api/products
app.post('/api/products', async (req, res) => {
    console.log('POST /api/products கோரிக்கை பெறப்பட்டது. உடல் (Body):', req.body);
    const { name, price, image, description, category } = req.body;

    // தேவையான புலங்கள் உள்ளதா என சரிபார்க்கவும்
    if (!name || !price || !description || !category) {
        return res.status(400).json({ message: 'தயாரிப்பு பெயர், விலை, விளக்கம் மற்றும் வகை அவசியம்.' });
    }

    try {
        const productsCollection = db.collection(COLLECTION_NAME);
        const newProduct = { name, price, image, description, category, createdAt: new Date() };
        const result = await productsCollection.insertOne(newProduct); // புதிய தயாரிப்பை செருகவும்
        console.log('புதிய தயாரிப்பு சேர்க்கப்பட்டது:', result.insertedId);
        // MongoDB தானாகவே _id புலத்தைச் சேர்க்கிறது, அதை நாம் திருப்பி அனுப்புகிறோம்
        res.status(201).json({ id: result.insertedId, ...newProduct });
    } catch (error) {
        console.error('தயாரிப்பைச் சேர்ப்பதில் பிழை:', error);
        res.status(500).json({ message: 'தரவுத்தளத்தில் தயாரிப்பைச் சேர்க்க முடியவில்லை.' });
    }
});

// MongoDB இல் ID மூலம் ஒரு குறிப்பிட்ட தயாரிப்பைப் புதுப்பிக்க PUT கோரிக்கை
// URL: /api/products/:id (உதாரணம்: /api/products/60d5ec49f8c1b2001c8c4567)
app.put('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, price, image, description, category } = req.body;
    console.log(`PUT /api/products/${productId} கோரிக்கை பெறப்பட்டது. உடல் (Body):`, req.body);

    // ID ஒரு செல்லுபடியாகும் MongoDB ObjectId வடிவத்தில் உள்ளதா என சரிபார்க்கவும்
    if (!ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'தயாரிப்பு ID வடிவம் செல்லுபடியாகவில்லை.' });
    }

    try {
        const productsCollection = db.collection(COLLECTION_NAME);
        const updateDoc = {
            $set: {
                name,
                price,
                image,
                description,
                category,
                updatedAt: new Date()
            }
        };
        const result = await productsCollection.updateOne(
            { _id: new ObjectId(productId) }, // ObjectId மூலம் வினவவும்
            updateDoc
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'தயாரிப்பு காணப்படவில்லை.' });
        }
        // புதுப்பிக்கப்பட்ட ஆவணத்தைப் பெற்று திருப்பி அனுப்பவும்
        const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });
        console.log('தயாரிப்பு புதுப்பிக்கப்பட்டது:', updatedProduct);
        res.json({ id: updatedProduct._id, ...updatedProduct });
    } catch (error) {
        console.error('தயாரிப்பைப் புதுப்பிப்பதில் பிழை:', error);
        res.status(500).json({ message: 'தரவுத்தளத்தில் தயாரிப்பைப் புதுப்பிக்க முடியவில்லை.' });
    }
});

// MongoDB இலிருந்து ID மூலம் ஒரு குறிப்பிட்ட தயாரிப்பை நீக்க DELETE கோரிக்கை
// URL: /api/products/:id (உதாரணம்: /api/products/60d5ec49f8c1b2001c8c4567)
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    console.log(`DELETE /api/products/${productId} கோரிக்கை பெறப்பட்டது.`);

    // ID ஒரு செல்லுபடியாகும் MongoDB ObjectId வடிவத்தில் உள்ளதா என சரிபார்க்கவும்
    if (!ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'தயாரிப்பு ID வடிவம் செல்லuபடியாகவில்லை.' });
    }

    try {
        const productsCollection = db.collection(COLLECTION_NAME);
        const result = await productsCollection.deleteOne({ _id: new ObjectId(productId) }); // ObjectId மூலம் நீக்கவும்

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'தயாரிப்பு காணப்படவில்லை.' });
        }
        console.log('தயாரிப்பு நீக்கப்பட்டது:', productId);
        res.status(204).send(); // வெற்றிகரமான நீக்கத்திற்கு 204 No Content
    } catch (error) {
        console.error('தயாரிப்பை நீக்குவதில் பிழை:', error);
        res.status(500).json({ message: 'தரவுத்தளத்திலிருந்து தயாரிப்பை நீக்க முடியவில்லை.' });
    }
});

// சர்வரைத் தொடங்கவும்
app.listen(PORT, () => {
    console.log(`சர்வர் http://localhost:${PORT} இல் இயங்குகிறது.`);
    console.log('API எண்ட்பாயிண்ட்கள்:');
    console.log(`  GET    /api/products`);
    console.log(`  POST   /api/products`);
    console.log(`  PUT    /api/products/:id`);
    console.log(`  DELETE /api/products/:id`);
});
