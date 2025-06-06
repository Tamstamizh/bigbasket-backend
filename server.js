// server.js - Simple Node.js Express Backend Server (with MongoDB)

// Import necessary modules
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // Import MongoClient and ObjectId from mongodb driver

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001; // Port for the server to run on (3001 or from environment variable)

// --- MongoDB Connection Setup ---
// Replace this with your actual MongoDB connection string (from MongoDB Atlas).
// The direct 'mongodb://' format is used here to avoid DNS lookup issues
// that can occur with 'mongodb+srv://' in some deployment environments (like Render.com).
// Ensure to replace 'Tamizh@4596' with your actual database user password.
// The correct cluster address is 'tharshan.ix4qfl9.mongodb.net'.
const MONGODB_URI = 'mongodb://Tamizh:Tamizh%404596@tharshan-shard-00-00.ix4qfl9.mongodb.net:27017,tharshan-shard-00-01.ix4qfl9.mongodb.net:27017,tharshan-shard-00-02.ix4qfl9.mongodb.net:27017/bigbasket_clone?authSource=admin&replicaSet=THARSHAN-shard-0'
const DB_NAME = 'bigbasket_clone'; // Name of your database
const COLLECTION_NAME = 'products'; // Name of your collection for products

let db; // Variable to hold the database connection

// Function to connect to MongoDB
async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect(); // Connect to the MongoDB server
        db = client.db(DB_NAME); // Get the database instance
        console.log(`Successfully connected to MongoDB: ${MONGODB_URI}`);
        console.log(`Using database: ${DB_NAME}`);
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // Exit process if unable to connect to the database
    }
}

// Connect to MongoDB when the server starts
connectToMongoDB();

// --- Middleware ---
app.use(express.json()); // To parse JSON request bodies
app.use(cors()); // To allow CORS policies (allow requests from frontend application)

// --- API Routes ---

// GET request to fetch all products from MongoDB
// URL: /api/products
app.get('/api/products', async (req, res) => {
    console.log('GET /api/products request received.');
    try {
        const productsCollection = db.collection(COLLECTION_NAME);
        const products = await productsCollection.find({}).toArray(); // Retrieve all products
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to retrieve products from the database.' });
    }
});

// POST request to add a new product to MongoDB
// URL: /api/products
app.post('/api/products', async (req, res) => {
    console.log('POST /api/products request received. Body:', req.body);
    const { name, price, image, description, category } = req.body;

    // Validate required fields
    if (!name || !price || !description || !category) {
        return res.status(400).json({ message: 'Product name, price, description, and category are required.' });
    }

    try {
        const productsCollection = db.collection(COLLECTION_NAME);
        const newProduct = { name, price, image, description, category, createdAt: new Date() };
        const result = await productsCollection.insertOne(newProduct); // Insert the new product
        console.log('New product added:', result.insertedId);
        // MongoDB automatically adds an _id field, which we return
        res.status(201).json({ id: result.insertedId, ...newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product to the database.' });
    }
});

// PUT request to update a specific product by ID in MongoDB
// URL: /api/products/:id (Example: /api/products/60d5ec49f8c1b2001c8c4567)
app.put('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { name, price, image, description, category } = req.body;
    console.log(`PUT /api/products/${productId} request received. Body:`, req.body);

    // Validate if the ID is a valid MongoDB ObjectId format
    if (!ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Product ID format is invalid.' });
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
            { _id: new ObjectId(productId) }, // Query by ObjectId
            updateDoc
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        // Retrieve and return the updated document
        const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });
        console.log('Product updated:', updatedProduct);
        res.json({ id: updatedProduct._id, ...updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product in the database.' });
    }
});

// DELETE request to delete a specific product by ID from MongoDB
// URL: /api/products/:id (Example: /api/products/60d5ec49f8c1b2001c8c4567)
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    console.log(`DELETE /api/products/${productId} request received.`);

    // Validate if the ID is a valid MongoDB ObjectId format
    if (!ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Product ID format is invalid.' });
    }

    try {
        const productsCollection = db.collection(COLLECTION_NAME);
        const result = await productsCollection.deleteOne({ _id: new ObjectId(productId) }); // Delete by ObjectId

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        console.log('Product deleted:', productId);
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product from the database.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}.`);
    console.log('API Endpoints:');
    console.log(`  GET    /api/products`);
    console.log(`  POST   /api/products`);
    console.log(`  PUT    /api/products/:id`);
    console.log(`  DELETE /api/products/:id`);
});
