'use strict';

const b = require('bcryptjs');

const nonce = require('./nonce');
const db = require('./db');

const SSO_COOKIE = '_EV_ID';

const _E = {
  E1: { msg: 'Invalid username/password' },
};

/**
 * Still to do:
 * - Auth attempt logging
 * - Create session token in db
 * - Set session token in cookie
 * - Create/redeem nonces (prevent replay-attack)
 */

module.exports = function (app) {

  let routes = [];

  addRoute(app.get('/', (req, res) => {
    res.redirect(303, '/sso/auth/dialog');
  }));

  addRoute(app.get('/sso/auth/dialog', (req, res) => {

    let d = {
      app_id: 'ea8e1f08-58cd-4317-9d90-2e5ace7a92a2',
      error: '',
    };

    if (req.query.code) {
      console.log('code: ' + req.query.code);
      d.error = errorElem(req.query.code);
    }

    nonce
      .create('login')
      .then((nonce) => {

        d.nonce = nonce.nonce;

        res.cookie(SSO_COOKIE, sessionToken(), { domain: `${req.hostname}`, secure: true });
        res.cookie(SSO_COOKIE, sessionToken(), { domain: `${req.hostname}`, http: true });

        res.render('sso/auth/dialog', d);

      });

  }));

  addRoute(app.post('/sso/auth/attempt', (req, res) => {

    console.log(req.body);

    let app_id = req.body.app_id;
    let user_id = req.body.user_id;
    let password = req.body.password;

    db.fetchAppUserByLogin(app_id, user_id)
      .then((appUser) => {
        
        console.log(appUser);

        let loginSuccess = b.compareSync(password, appUser.attributes.password);
        if (loginSuccess) {
          // Login success
          return res.send(appUser);
        }
        
        // Login failure
        // - wrong password
        invalidLogin(res);

      })
      .catch((err) => {

        if (db.ERR_NO_RECORDS === err) {
          // Login failure
          // - no such user id
          return invalidLogin(res);
        }

      });

  }));

  return routes;

  function addRoute (route) {
    routes.push(route);
  }

  function invalidLogin (res) {
    res.redirect(303, '/sso/auth/dialog?code=E1');
  }

  function errorElem (code) {
    return `<p class="error"><span class="material-icons">warning</span> ${_E[code].msg}</p>`;
  }

  function sessionToken () {
    let token = Date.now();
    return `session/${token}`;
  }

};
