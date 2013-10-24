var libs = require('../libs'),
  async = require('async'),
  models = require('../models');

var emailer = libs.emailer,
  logger = libs.logger;

var Registration = models.registration,
  User = models.user;

module.exports = [{
  /**
   * @api {post} /registration Register an email address
   * @apiVersion 1.0.0
   * @apiName Register
   * @apiGroup Registration
   *
   * @apiParam {String} emailAddress Registration Email Address.
   *
   * @apiSuccess {String} key Registration Key for creating a user;
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "key": ""
   *     }
   *
   * @apiError UserNotFound The id of the User was not found.
   *
   * @apiErrorExample Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": "UserNotFound"
   *     }
   */
  verb: 'post',
  callback: function(request, callback) {
    /*
      request.body.key
      request.body.secret
      request.body.emailAddress
      request.body.name
      request.body.password
      */

    function findRegistration(cb) {
      Registration.find({
        where: {
          emailAddress: request.body.emailAddress,
          key: request.body.key,
          secret: request.body.secret,
          userId: null,
          registeredAt: {
            gt: new Date(new Date() - 5 * 60 * 1000)
          }
        },
        order: "registeredAt DESC"
      }).success(function(registration) {
        cb(undefined, registration);
      }).error(function(error) {
        cb(error, undefined);
      });
    }

    function findUser(cb) {
      // returns list of similar username available or undefined for available name or empty for no similar name
      User.find({
        where: {
          name: request.body.name
        }
      }).success(function(user) {
        cb(undefined, user);
      }).error(function(error) {
        cb(error);
      });
    }
    async.parallel({
      registration: findRegistration,
      user: findUser
    }, function(err, results) {
      if (results.registration && !results.user) {
        var user = User.newLogin({
          name: request.body.name,
          password: request.body.password,
          emailAddress: request.body.emailAddress
        }).success(function(user) {
          user.setRegistration(results.registration).success(function(user) {

            callback();
          }).error(function(error) {
            logger.error(error);
            callback(500, {
              error: error
            });
          });
        }).error(function(error) {
          if (error.name) {
            callback(400, {
              error: error
            });
          } else {
            logger.error(error);
            callback(500, {
              error: error
            });
          }
        });
      } else {
        if (!results.registration) {
          callback(400, {
            "error": "Registration information invalid."
          });
        } else if (results.user) {
          callback(400, {
            "error": "Username is already being used."
          });
        }
      }
    });
  }
}];
