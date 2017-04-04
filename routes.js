'use strict';

const b = require('bcryptjs');
const url = require('url');

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

  let sessionsById = {};

  addRoute(app.get('/', (req, res) => {
    let a = req.query.a;
    res.redirect(303, `/sso/auth/dialog?a=${a}`);
  }));

  addRoute(app.get('/sso/auth/dialog', (req, res) => {

    let d = {
      session_id: req.query.a,
      app_id: 'ea8e1f08-58cd-4317-9d90-2e5ace7a92a2',
      referer: req.headers['referer'],
      error: '',
    };

    if (req.query.code) {
      console.log('code: ' + req.query.code);
      d.error = errorElem(req.query.code);
    }

    nonce
      .create('login')
      .then((nonce) => {
    
        let session_id = req.cookies[SSO_COOKIE];

        res.setHeader('Access-Control-Allow-Origin', '*');

        if (!sessionsById[session_id]) {
          sessionsById[session_id] = newSession(req);
        }

        d.nonce = nonce.nonce;

        // res.cookie(SSO_COOKIE, session_id, { domain: `${req.hostname}`, secure: true });
        // res.cookie(SSO_COOKIE, session_id, { domain: `${req.hostname}`, http: true });

        res.render('sso/auth/dialog', d);

      });

  }));

  addRoute(app.post('/sso/auth/attempt', (req, res) => {

    console.log(req.body);

    let app_id = req.body.app_id;
    let user_id = req.body.user_id;
    let password = req.body.password;
    let session_id = req.body.session_id;
    let referer = req.body.referer;

    db.fetchAppUserByLogin(app_id, user_id)
      .then((appUser) => {

        let loginSuccess = b.compareSync(password, appUser.attributes.password);
        if (loginSuccess) {
          // Login success
          startSessionFor(session_id, referer, appUser, req, res);
          return;
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

  addRoute(app.get('/sso/id', (req, res) => {
    
    let session;
    let referer;

    let session_id = req.query.a;

    res.setHeader('Access-Control-Allow-Origin', '*');

    session = sessionsById[session_id];
    if (!session) {
      session = sessionsById[session_id] = newSession(req);
    }

    referer = url.parse(req.headers['referer'] || 'http://localhost/');
    if (referer.hostname !== url.parse(session.referer).hostname) {
      res.status(200).send({});
      return;
    }

    res.status(200).send(session);


  }));

  return routes;

  function startSessionFor (session_id, referer, appUser, req, res) {
    
    sessionsById[session_id].referer = referer;
    sessionsById[session_id].anonymous = false;
    sessionsById[session_id].login = {
      owner: {
        given_name: 'Callan',
        family_name: 'Milne',
      },
    };

    res.render('sso/auth/done', {});

  }

  function addRoute (route) {
    routes.push(route);
  }

  function invalidLogin (res) {
    res.redirect(303, '/sso/auth/dialog?code=E1');
  }

  function errorElem (code) {
    return `<p class="error"><span class="material-icons">warning</span> ${_E[code].msg}</p>`;
  }

  function newSession (req) {

    let x = {
      referer: req.headers['referer'] || 'http://localhost/',
      loginUrl: `//${req.hostname}:3000/sso/auth/dialog?a=${req.query.a}`,
      anonymous: true,
    };

    return x;

  }

};
