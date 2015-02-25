var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);
var db = require("../libs/sequelize");

module.exports = function (sequelize, DataTypes) {
/*
  var Registration = sequelize.$('registration'),
      App = sequelize.$('app'),
      Device = sequelize.$('device'),
      Role = sequelize.$('role'),
      Company = sequelize.$('company');
  */

  var User = sequelize.define("user", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    }
  }, {
    classMethods: {
      findByLogin: function (name, password, cb) {
        User.find({
          where: {
            name: name
          }
        }).success(function (user) {
          if (user && bcrypt.compareSync(password, user.password)) {
            cb(user);
          } else {
            cb();
          }
        });
      },
      newLogin: function (data) {
        data.password = bcrypt.hashSync(data.password, salt);
        return User.create(data);
      },
      associate: function (models) {
        models.registration.belongsTo(User);
        User.belongsTo(models.company).belongsTo(models.registration).belongsTo(models.role).hasMany(models.app).hasMany(models.device).hasOne(models.company, {
          as: 'contact',
          foreignKey: 'contactId'
        });

        models.device.hasMany(User);
      }
    }
  });

/*
  Registration.belongsTo(User);
  User.belongsTo(Company).belongsTo(Registration).belongsTo(Role).hasMany(App).hasMany(Device).hasOne(Company, {
    as: 'contact',
    foreignKey: 'contactId'
  });

  Device.hasMany(User);
  */

  return User;
};