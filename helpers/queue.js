const { noop } = require('./utils');

class MessageQueue {
  constructor() {
    this.queue = [];
    this.interval = null;
    this.isProcessing = false;
    this.errors = [];
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  enqueue(messages) {
    this.queue.push(...messages);

    return Promise.resolve(this);
  }

  dequeue() {
    return this.queue.shift();
  }

  count() {
    return this.queue.length;
  }

  getErrors() {
    return this.errors;
  }

  stop() {
    clearInterval(this.interval);

    this.interval = null;
    this.isProcessing = false;
  }

  // Process queued up messages with the given handler function
  process(handler = noop) {
    if (this.isProcessing) {
      return Promise.resolve(this);
    }

    this.isProcessing = true;
    this.interval = setInterval(() => {
      if (this.isEmpty()) {
        console.log('Queue is empty! Stop processing.');
        return this.stop();
      }

      const message = this.dequeue();

      console.log('Processing next message:', message);
      console.log(`Messages remaining: ${this.count()}`);

      return handler(message)
        .then(r => console.log('Message successfully processed!', message))
        .catch(err => this.errors.push({ message, err }));
    }, 5000);

    return Promise.resolve(this);
  }

  inspect() {
    return this.queue;
  }
}

module.exports = new MessageQueue();
