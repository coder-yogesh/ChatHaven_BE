const express = require('express');
const serverless = require('serverless-http');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParse = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require("../auth");
const app = express();
const router = express.Router();

const { default: axios } = require('axios');
app.use(cors());
dotenv.config();
app.use(bodyParse.json());

app.use(
  session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

router.use("/api/auth", authRoutes);

const port = Number(process.env.BACK_END_PORT);
app.use(`${process.env.BACK_END_URL}`, router);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('keyyyyy', process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function callChatGPT(prompt) {
    const response = await model.generateContent(prompt);
    return response.response.text();
}


router.get('/', (req, res) => {
  console.log('calling');
  res.send('App is running..');
});

router.post('/add', async (req, res) => {
  console.log('req', req.body);
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Promptttttt is required' });
  }
  const response = await callChatGPT(prompt);
  
  console.log('testting')
  res.status(200).json({ message: response });
  res.send('New record added.');
});

router.delete('/', (req, res) => {
  res.send('Deleted existing record');
});

router.put('/', (req, res) => {
  res.send('Updating existing record');
});

router.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is missing' });
    }
    console.log('dddd', url);
    // Optional: Validate the URL (basic check)
    // const validUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i;
    // if (!validUrl.test(url)) {
    //   console.log('ddddd');
    //   return res.status(400).json({ error: 'Invalid image URL' });
    // }

    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    
    // res.set('Content-Type', response.headers['content-type']);
    console.log('resssss', response.data);
    // res.send(response.data.toString('base64'));
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers['content-type'],
        'Access-Control-Allow-Origin': '*',
      },
      body: response.data.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error fetching image:', error.message);
    res.status(500).json({ error: 'Error fetching image' });
  }
});

// router.get('/proxy-image', async (req, res) => {
//     try {
//         const { url } = req.query;
//         console.log('image', req.query);
//         if (!url) {
//             console.log('no url', url);
//           return res.status(400).send('URL parameter is missing');
//         }
//         const response = await axios.get(url, { responseType: 'arraybuffer' });
//         // res.set('Content-Type', response.headers['content-type']);
//         console.log('response', response.data);
//         // res.status(200).send(response.data);
//         return {
//             statusCode: 200,
//             headers: {
//                 'Content-Type': response.headers['content-type'],
//             },
//             body: response.data.toString('base64'),
//             isBase64Encoded: true,
//         };
//       } catch (error) {
//         res.status(500).send('Error fetching image');
//       }
// })
router.get('/demo', (req, res) => {
  res.json([
    {
      id: '001',
      name: 'Aayush',
    },
    {
      id: '002',
      name: 'rohit',
    },
    {
      id: '003',
      name: 'Mohit',
    },
  ]);
});

router.post('/chatgpt', async (req, res) => {
    try {
        console.log('req', req.body);
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Promptttttt is required' });
        }
        const response = await callChatGPT(prompt);
        return res.status(200).json({ message: response });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});
console.log('main port', port);
if (port === 4000) {
  app.listen(port, () => {
    console.log('server running');
  })
} else {
  module.exports.handler = serverless(app);
}
// module.exports.handler = serverless(app);