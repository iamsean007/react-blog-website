var express = require('express');
var bodyParser =  require('body-parser');
var {MongoClient} = require('mongodb');
var path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const WithDB = async (operations, res) => {

    try{
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');

        await operations(db);
        
        client.close();
    }
    catch(error){
        res.status(500).json( { message: "Coundn't connect to database", error });
    }

};

app.get("/api/articles/:name", async (req, res) => {
    WithDB( async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(articlesInfo);
    }, res);
});

app.post('/api/articles/:name/upvotes', async (req, res) => {
    WithDB( async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });

        await db.collection('articles').updateOne({ name: articleName}, 
        {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        });
        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updateArticleInfo);

    }, res);

});

app.post('/api/articles/:name/add-comments', (req, res) => {

    const { username, text } = req.body;

    const articleName = req.params.name;

    WithDB( async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });

        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articlesInfo.comments.concat({username, text}),
            },
        });

        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updateArticleInfo);

    }, res);


});

//all other requests that aren't caught by our API route, should be passed to our app.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log("Listening on Port 8000"));