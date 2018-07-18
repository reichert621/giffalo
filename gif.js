const request = require('superagent');
const { get } = require('lodash');

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_UPLOAD_API = 'https://upload.giphy.com/v1/gifs';
const GIPHY_BASE_URL = 'https://giphy.com/embed';

const getGiphyUrl = id => {
  return `http://media2.giphy.com/media/${id}/giphy.gif`;
};

const create = url => {
  return request
    .post(GIPHY_UPLOAD_API)
    .type('form')
    .send({ api_key: GIPHY_API_KEY })
    .send({ source_image_url: url })
    .then(result => {
      console.log('Success!', result.body);
      const id = get(result, 'body.data.id');

      return getGiphyUrl(id);
    })
    .catch(err => {
      console.log('Error!', err);
    });
};

module.exports = {
  create
};
