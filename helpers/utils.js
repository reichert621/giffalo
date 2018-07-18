const VIDEO_TYPE = 'video';

module.exports = {
  VIDEO_TYPE,
  noop: (...args) => Promise.resolve(args),
  isVideo: attachment => attachment && attachment.type === VIDEO_TYPE,
  wait: ms => new Promise(res => setTimeout(res, ms))
};
