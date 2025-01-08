const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const qs = require('qs');
const crypto = require('crypto');

const app = express();
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/src/pages');

app.use(express.static('public'));
app.use('/webhook', bodyParser.raw({ type: '*/*' }));
const applicationSecret = process.env.FRONTSECRET;


app.post('/webhook', (req, res) => {
  try {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body.toString('utf-8')); 
    const signature = req.headers['x-front-signature'];
    const xFrontChallenge = req.headers['x-front-challenge'];
    const timestamp = req.headers['x-front-request-timestamp'] + ':';

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);

    const concatenated = Buffer.concat([Buffer.from(timestamp, 'utf-8'), rawBody]);

    const hashed = crypto
      .createHmac('sha256', applicationSecret)
      .update(concatenated)
      .digest('base64');

    if (hashed === signature) {
      const acceptHeader = req.headers['accept'];

      if (acceptHeader === 'application/json') {
        res.status(200).json({ challenge: xFrontChallenge });
      } else if (acceptHeader === 'application/x-www-form-urlencoded') {
        res.status(200).send(`challenge=${xFrontChallenge}`);
      } else {
        res.status(200).type('text/plain').send(xFrontChallenge);
      }
    } else {
      res.status(400).send('Bad Request: validation failed');
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.use(bodyParser.json());


app.get('/', (req, res) => {
  res.render('index', { title: 'Front Plugin', message: 'Hello Front!' });
});



app.post('/email', async (req, res) => {

  try {
    const { email, mc = [], dot = [] } = req.body;

    const cleanMC = mc.map(num => num.replace(/MC/i, '').trim());
    const cleanDOT = dot.map(num => num.replace(/DOT/i, '').trim());

    let data1 = qs.stringify({ 'email': email || 'test@gmail.com' });

    let config1 = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://staging.gohighway.com/core/connect/external_api/v1/carriers/email_search_associated_carriers',
      headers: { 
        'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY, 
      },
      data: data1
    };

    const dotConfigs = cleanDOT.map(dotNumber => {
      return {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${dotNumber}&q[identifiers_is_type_eq]=DOT`,
        headers: { 
          'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
        }
      };
    });

    const mcConfigs = cleanMC.map(mcNumber => {
      return {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://staging.gohighway.com/core/connect/external_api/v1/carriers?q[identifiers_value_eq]=${mcNumber}&q[identifiers_is_type_eq]=MC`,
        headers: { 
          'Authorization': 'Bearer ' + process.env.HIGHWAYAPIKEY
        }
      };
    });

    const [emailResponse, ...otherResponses] = await Promise.all([
      axios.request(config1),
      ...dotConfigs.map(config => axios.request(config)),
      ...mcConfigs.map(config => axios.request(config))
    ]);

    const dotResponses = otherResponses.slice(0, dotConfigs.length);
    const mcResponses = otherResponses.slice(dotConfigs.length);
    const combinedData = {
      emailSearch: emailResponse.data,
      dotSearch: dotResponses.map(res => res.data),
      mcSearch: mcResponses.map(res => res.data)
    };

    res.status(200).json(combinedData);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data from Highway API' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
