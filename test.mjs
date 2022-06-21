import getDB from "./database.mjs";

// Create and display some sample data
getDB().then(async (db) => {
  // We create some trips and display them
  const trip1 = await db.Trip.create({
    name: "Trip 1",
    price: 99.9,
    description: "Desc1",
  });
  console.log("trip1 ID:", trip1.id);
  const trip2 = await db.Trip.create({
    name: "Trip 2",
    price: 308.9,
    description: "Desc2",
  });
  console.log("trip2 ID:", trip2.id);
  const trips = await db.Trip.findAll();
  console.log("All trips:", JSON.stringify(trips, null, 2));

  // We create a user and display it
  const user1 = await db.User.create({
    name: "John",
    last_name: "Doe",
    email: "email@mail.com",
    password: "mySecret123",
  });
  console.log("user1 ID:", user1.id);
  const users = await db.User.findAll();
  console.log("All users:", JSON.stringify(users, null, 2));

  // We create some reservations and display them
  const res1 = await db.Reservation.create({
    name: "John",
    last_name: "Doe",
    email: "email@mail.com",
    number_of_seats: 5,
    myTripID: trip2.id,
    myUserID: user1.id,
  });
  console.log("res1 ID:", res1.id);
  const res2 = await db.Reservation.create({
    name: "Unregistered",
    last_name: "User",
    email: "emailunreg@mail.com",
    number_of_seats: 2,
    myTripID: trip2.id,
    myUserID: null,
  });
  console.log("res2 ID:", res2.id);
  const reservations = await db.Reservation.findAll();
  console.log("All reservations:", JSON.stringify(reservations, null, 2));
});
