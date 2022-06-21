import { Sequelize, DataTypes } from "sequelize";

/* only pick one */

// Declaration to store in memory
const sequelize = new Sequelize("sqlite::memory:");

// Declaration to store in mydatabase.sqlite file
/*
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './mydatabase.sqlite',
});
*/

// Declaration to use Postgres (fill the the parameters: database, username, password, etc)
/*
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres',
});
*/

function createTripTable() {
  const Trip = sequelize.define("Trip", {
    /*
      A sample of trip table (some missing fields, such as images.
      Add your own definition here if creation of trip table is needed)
    */
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        isPositive(value) {
          if (value <= 0) {
            throw new Error("Only positive values are allowed!");
          }
        },
      },
    },
  });
  return Trip;
}

function createReservationTable() {
  const Reservation = sequelize.define("Reservation", {
    /*
      A sample of reservation table.
      Add your own definition here if creation of reservation table is needed.
    */
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    number_of_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  return Reservation;
}

function createUserTable() {
  // A simple proposal for user table
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  return User;
}

export default async function getDB() {
  try {
    await sequelize.authenticate();
    console.log(
      "Connection to the database has been established successfully."
    );

    const db = {};
    db.sequelize = sequelize;

    /*
      Trip table (omit if you have this table already.
        Otherwise add your own definition in trip.js)
    */
    db.Trip = createTripTable();
    /*
       Reservations table (omit if you have this table already.
        Otherwise add your own definition in reservation.js)
    */
    db.Reservation = createReservationTable();

    /*
       User table (A simple table for users defined in user.js)
    */
    db.User = createUserTable();

    // Relations
    // A trip has many reservations
    db.Trip.hasMany(db.Reservation, {
      foreignKey: "myTripID",
    });
    // A user has many reservations
    db.User.hasMany(db.Reservation, {
      foreignKey: "myUserID",
    });

    await db.sequelize.sync();

    return db;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}
