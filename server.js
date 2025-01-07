const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');

const app = express();

// Middleware to parse JSON body
app.use(bodyParser.json());

// Setup Handlebars
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/src/pages');

// Serve static files
app.use(express.static('public'));

// Test Home Page
app.get('/', (req, res) => {
  res.render('index', { title: 'Front Plugin', message: 'Hello Front!' });
});

// Webhook Route
app.post('/webhook', (req, res) => {
  console.log('Webhook hit at:', new Date().toISOString());
  console.log('Payload:', req.body);

  res.status(200).send('Webhook received!');
});

app.get('/api/alerts', async (req, res) => {
  try {
    const response = await axios.get('https://staging.highway.com/core/connect/external_api/v1/alerts', {
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
      }
    });

    res.json(response.data); 
  } catch (error) {
    console.error('Error fetching alerts:', error.message);

    console.error('Full error details:', error.response ? error.response.data : error);

    res.status(500).json({
      error: 'Failed to fetch alerts',
      details: error.response ? error.response.data : 'No response from server'
    });
  }
});
// Listen on the port provided by Glitch or default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
