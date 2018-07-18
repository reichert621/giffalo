const express = require('express');
const bodyParser = require('body-parser');
const { first, reduce } = require('lodash');
const gif = require('./helpers/gif');
const fb = require('./helpers/fb');
const queue = require('./helpers/queue');
const { isVideo } = require('./helpers/utils');

const PORT = process.env.PORT || 1337;
const VERIFY_TOKEN = process.env.GIFFALO_VERIFY_TOKEN;

// Creates a GIPHY gif from the FB url, and sends both the
// GIPHY link as well as the gif attachment back to the user.
const createAndSendGif = async ({ senderId, url }) => {
  const giphy = await gif.create(url);
  const text = await fb.messageAsText(senderId, giphy);
  const attachment = await fb.messageAsAttachment(senderId, giphy);

  return { text, attachment };
};

module.exports = express()
  // Parse incoming request bodies (makes `req.body` available in handlers)
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  // For testing API
  .get('/ping', (req, res) => res.json({ message: 'Pong!' }))
  // Sets up webhook to sync with FB
  .get('/webhook', (req, res) => {
    const { query = {} } = req;
    const mode = query['hub.mode'];
    const challenge = query['hub.challenge'];
    const token = query['hub.verify_token'];
    const isMatch = token === VERIFY_TOKEN;

    if (mode && challenge && isMatch) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403);
    }
  })
  // Check current jobs (requires token)
  .get('/jobs', (req, res) => {
    const { token } = req.query;

    if (token === fb.FB_ACCESS_TOKEN) {
      return res.json({ queue: queue.inspect() });
    } else {
      return res.json({ error: 'Invalid token.' });
    }
  })
  // Check latest errors (requires token)
  .get('/errors', (req, res) => {
    const { token } = req.query;

    if (token === fb.FB_ACCESS_TOKEN) {
      return res.json({ errors: queue.getErrors() });
    } else {
      return res.json({ error: 'Invalid token.' });
    }
  })
  // Handles messages sent to chat bot on FB
  .post('/webhook', (req, res) => {
    const { entry = [] } = req.body;
    const messages = reduce(
      entry,
      (result, e) => {
        const attachments = reduce(
          e.messaging,
          (acc, m) => {
            const { message, sender } = m;
            const { id: senderId } = sender;
            const { attachments = [], text } = message;
            const attachment = first(attachments) || null;

            if (isVideo(attachment)) {
              const { payload } = attachment;
              const { url } = payload;

              return acc.concat({ senderId, url });
            } else {
              return acc;
            }
          },
          []
        );

        return result.concat(attachments);
      },
      []
    );

    return queue
      .enqueue(messages)
      .then(() => res.json({ status: 'ok' }))
      .catch(err => {
        console.log('Something went wrong!', err);

        return res.json({ error: err });
      })
      .then(() => queue.process(createAndSendGif))
      .catch(err => {
        console.log('Error sending messages!', err);
      });
  })
  // Initializes the server
  .listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
