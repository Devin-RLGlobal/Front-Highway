const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const qs = require('qs');
const crypto = require('crypto');
const fs = require('fs');


const app = express();
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/src/pages');

app.use(express.static('public'));
app.use('/webhook', bodyParser.raw({ type: '*/*' }));
const applicationSecret = process.env.FRONTSECRET;


const rawData = fs.readFileSync('domains.json');
const { domains } = JSON.parse(rawData);

const domainSet = new Set(domains);

app.post('/webhook', (req, res) => {
  try {
    // console.log('Headers:', req.headers);
    // console.log('Raw Body:', req.body.toString('utf-8'));

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
      console.log("Signature validation successful");

      let parsedBody;
      try {
        parsedBody = JSON.parse(req.body.toString('utf-8'));
      } catch (err) {
        console.error('Error parsing webhook body:', err);
        return res.status(400).send('Invalid JSON');
      }

      const payload = parsedBody.payload || {};
      const target = payload.target || {};
      const data = target.data || {};

      const recipients = data.recipients || [];
      const sender = recipients.find(r => r.role === 'from');
      const senderEmail = sender ? sender.handle : 'Unknown';

      const plainTextBody = data.text || 'No plain text body';

      console.log('Sender Email:', senderEmail);
      // console.log('Plain Text Body:', plainTextBody);
      let numResult = getNumbers(plainTextBody)
      let mcnums = numResult['mc']
      let dotnums = numResult['dot']
      const conversationId = target.payload.conversation.id;

      if(checkDomain() == false){
        callMcleod(senderEmail)
                // console.log("HIGHWAY DATA:", callHighway({email: senderEmail, mc: mcnums, dot: dotnums}))
        console.log(conversationId);
        const url = `https://api2.frontapp.com/conversations/`+conversation_id+`/tags`;
        const options = {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({tag_ids: ['tag_4yeuak']})
        };

        fetch(url, options)
          .then(res => res.json())
          .then(json => console.log(json))
          .catch(err => console.error(err));
        

      }
      else{
        const url = `https://api2.frontapp.com/conversations/`+conversation_id+`/tags`;
        const options = {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({tag_ids: ['tag_4yeucc']})
        };

        fetch(url, options)
          .then(res => res.json())
          .then(json => console.log(json))
          .catch(err => console.error(err));
      }
      const acceptHeader = req.headers['accept'];
      if (acceptHeader === 'application/json') {
        res.status(200).json({ challenge: xFrontChallenge });
      } else if (acceptHeader === 'application/x-www-form-urlencoded') {
        res.status(200).send(`challenge=${xFrontChallenge}`);
      } else {
        res.status(200).type('text/plain').send(xFrontChallenge);
      }
    } else {
      console.error("Signature validation failed");
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



function checkDomain(domain) {
    return domainSet.has(domain);
}


async function callHighway(reqData) {
  try {
      const response = await axios.post('https://dolphin-app-w5254.ondigitalocean.app/highway', reqData, {
          headers: {
              'Content-Type': 'application/json',
          },
      });

      if (response.status !== 200) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return response.data;

  } catch (error) {
      console.error('Error calling /email route:', error.message);
      throw error; 
  }
}

async function callMcleod(reqData) {
  console.log("SENDER EMAIL: ", reqData)
  return
  try {
      const response = await axios.post('https://dolphin-app-w5254.ondigitalocean.app/carriers', reqData, {
          headers: {
              'Content-Type': 'application/json',
          },
      });

      if (response.status !== 200) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return response.data;

  } catch (error) {
      console.error('Error calling /email route:', error.message);
      throw error; 
  }
}



app.post('/highway', async (req, res) => {

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
      // console.log(JSON.stringify(combinedData["emailSearch"], null, 2));
      // console.log(JSON.stringify(combinedData["dotSearch"], null, 2));
      // console.log(JSON.stringify(combinedData["mcSearch"], null, 2));

    res.status(200).json(combinedData);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data from Highway API' });
  }
});

app.get("/carriers", async (req, res) => {
  const { myquery } = req.query; 
  console.log(myquery)
  try {

    const requestOptions = {
      method: "GET",
      headers: headers,
      redirect: "follow",
    };

    const response = await fetch(
      `https://servicestruckload.stgextrlc.net/ws/customers/search?email=${encodeURIComponent(myquery)}`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function searchMCNumbers(body) {
  const regex = /MC\d+/g;

  const matches = body.match(regex);

  return matches || [];
}

function searchDOTNumbers(body) {
  const regex = /DOT\d+/g;

  const matches = body.match(regex);
  
  return matches || [];
}
 function getNumbers(data) {
  try {
      let mcNums = [];
      let dotNums = [];
      mcNums.push(...searchMCNumbers(data));
      dotNums.push(...searchDOTNumbers(data));
      return { mc: mcNums, dot: dotNums };
  } catch (error) {
      console.error(error);
      return { error: "Failed to retrieve numbers", details: error.message };
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
