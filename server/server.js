const express = require('express');

const app = express();
app.use(express.json());
  
app.get('/', (req, res) => {
    res.send('Welcome to Edurekas REST API with Node.js Tutorial!!');
});
 

app.post('/api/books', (req, res)=> {
    
    const { error } = validateBook(req.body);
    if (error){
    res.status(400).send(error.details[0].message)
    return;
    }
    const book = {
    id: books.length + 1,
    title: req.body.title
    };
    books.push(book);
    res.send(book);
});
 
 
//PORT ENVIRONMENT VARIABLE
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));