db.createUser({
    user: "admin",
    pwd: "ahMongoPWD",
    roles: [{ role: "root", db: "admin" }]
  })
  