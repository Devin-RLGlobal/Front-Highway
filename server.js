const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

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

app.get('/email', async (req, res) => {

  let data = qs.stringify({
    'email': 'test@gmail.com' 
  });
  
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://highway.com/core/connect/external_api/v1/carriers/email_search_associated_carriers',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded', 
      'Authorization': 'Bearer' + process.env.HIGHWAYAPIKEY, 
      'Cookie': '_highway_etl_session=MKCFiKKsnMoEkkOb6r7MxGkgCSZNrm0M6TVdGZqKBXl5s41dyYC4AJQLrsEvHFbJZwWdbGAYG6bgv2azZY%2FxNzkqDjy5UbWgNOeTNIfbPojOJbXB3E9snQHCwSnAnGJM65gIaWca9Ob%2B4T6zX4THFcS53siupeXpCHpkw%2FR3GVH5EM%2BSYAXnXaPwRDrAmKETisxHAiUFAhyAmTGOXnM4xg8kQtISpZaTix7vf2xn0Gw%3D--alD42mY6Y91hA1cu--0Y0mGzMhxxFqOo1MvHz47Q%3D%3D'
    },
    data : data
  };
  
  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
  
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
