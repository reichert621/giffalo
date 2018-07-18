const request = require('superagent');

const FB_ACCESS_TOKEN = process.env.GIFFALO_FB_MESSENGER_TOKEN;
const FB_MESSAGE_API = 'https://graph.facebook.com/v2.6/me/messages';

const message = (senderId, msg) => {
  return request
    .post(FB_MESSAGE_API)
    .query({ access_token: FB_ACCESS_TOKEN })
    .send({
      message: msg,
      recipient: { id: senderId }
    });
};

const messageAsText = (senderId, text) => {
  return message(senderId, { text });
};

const messageAsAttachment = (senderId, url) => {
  return message(senderId, {
    attachment: {
      type: 'image',
      payload: {
        url,
        is_reusable: true
      }
    }
  });
};

module.exports = {
  FB_ACCESS_TOKEN,
  message,
  messageAsText,
  messageAsAttachment
};
