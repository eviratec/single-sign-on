'use strict';

const registry = {};

class Nonce {
  constructor () {
    this.nonce_id = undefined;
    this.nonce = undefined;
  }
}

module.exports = {
  create: function (type) {
    return new Promise((resolve, reject) => {
      let nonce = new Nonce();
      nonce.nonce = Date.now();
      registry[nonce.nonce] = nonce;
      resolve(nonce);
    });
  },
  claim: function (nonce) {
    
  },
};
