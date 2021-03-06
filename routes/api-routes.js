const User = require("../models/User");
const Post = require("../models/Post");
const Message = require("../models/Message")
const bcrypt = require("bcrypt");
const passport = require("passport")

module.exports = app => {
    //checks if user exists. if not, adds to db
    app.post("/api/users", function (req, res) {
        //searches db for email
        User.findOne({ email: req.body.email }, function (err, user) {
            if (err) {
                console.log(err);
            } else {
                //if email doesn't exist in db
                if (user === null) {
                    //protect pw
                    bcrypt.hash(req.body.password, 10, function (err, hash) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.body.password = hash;
                            // Then add to db
                            User.create(req.body, function (err, post) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(post);
                                    req.session.user = post._id;
                                }
                                res.sendStatus(200);
                            });
                        }
                    });
                    // Otherwise escape
                } else if (user) {
                    res.status(401).send("This email profile already exists.");
                }
            }
        });
    });

    //sign in functions
    app.post("/api/signin", function (req, res) {
        User.findOne({ email: req.body.email }, function (err, user) {
            console.log(req.body);
            if (err) {
                console.log(err);
            } else {
                //checks if user exists in db
                if (user === null) {
                    res.sendStatus(401);
                    return;
                } else {
                    //if user exists, compare pw
                    console.log(user);
                    bcrypt.compare(req.body.password, user.password, function (
                        err,
                        result
                    ) {
                        if (err) {
                            console.log(err);
                        }
                        if (!result) {
                            res.sendStatus(401);
                            return;
                        }
                        if (result) {
                            req.session.user = user._id;
                            req.session.loc = user.zip;
                            req.session.name = user.name;
                            console.log(req.session.user);
                            res.sendStatus(200);
                        }
                    });
                }
            }
        });
    });
    //update user info
    app.put("/api/users", function (req, res) {
        const userUpdate = {
            name: req.body.name,
            zip: req.body.location,
        };
        if (!req.session.user) {
            res.sendStatus(401);
            return;
        } else {
            if (

                userUpdate.name === undefined ||
                userUpdate.zip === undefined
            ) {
                console.log(req.body)
                console.log("Empty data!");
                res.sendStatus(401);
            } else
                console.log("Hello world")
            User.update({ _id: req.body.userId }, userUpdate, function (err, user) {
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                } else {

                    console.log("This is the User: ", user);
                    res.sendStatus(200);
                }
            });
        }

    });
    app.put("/api/session", function (req, res) {
        const userUpdate = {
            name: req.body.name,
            zip: req.body.location,
        };
        if (!req.session.user) {
            res.sendStatus(401);
            return;
        } else {
            if (

                userUpdate.name === undefined ||
                userUpdate.zip === undefined
            ) {
                console.log(req.body)
                console.log("Empty data!");
                res.sendStatus(401);
            } else {
                console.log("Hello world")
                console.log(req.session)
                _id = req.body.userId
                req.session.name = userUpdate.name;
                req.session.loc = userUpdate.zip;
                req.session.touch();
                res.sendStatus(200);
                //res.end();
                console.log("The session is now ", req.session)
                console.log("Session Data: ", req.session.name, req.session.loc)
            }
        };


    });
    //update user pw
    app.put("/api/users/password", function (req, res) {
        if (!req.session.user) {
            res.sendStatus(401);
            return;
        } else {
            User.findOne({ _id: req.body.userId }, function (err, user) {
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                } else {
                    console.log(user);
                    bcrypt.compare(req.body.password, user.password, function (
                        err,
                        result
                    ) {
                        if (err) {
                            console.log(err);
                            res.sendStatus(500);
                        } else if (!result) {
                            console.log(result);
                            res.sendStatus(401);
                        } else if (result) {
                            let newPassword = "";
                            bcrypt.hash(req.body.newPassword, 10, function (err, hash) {
                                if (err) {
                                    console.log(err);
                                    res.sendStatus(500);
                                } else {
                                    newPassword = hash;
                                }
                            });
                            User.updateOne(
                                { _id: req.body.userId },
                                { password: newPassword },
                                function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        res.sendStatus(500);
                                    } else {
                                        console.log(result);
                                        res.sendStatus(200);
                                    }
                                }
                            );
                        }
                    });
                }
            });
        }
    });
    // * Adds new post to db
    app.post("/api/posts", function (req, res) {
        // Checks for a session, if none return 401
        if (!req.session.user) {
            res.sendStatus(401);
            return;
        }
        // If signed in, create new post with req data
        Post.create(req.body, function (err, post) {
            if (err) {
                console.log(err);
            } else {
                console.log(post);
                res.sendStatus(200);
            }
        });
    });
    // * Get session data
    app.get("/api/session", function (req, res) {
        console.log(req.session);
        if (!req.session.user) {
            res.status(401).send("No user is signed in on this session");
        } else {
            console.log(`Session cookie is ${req.session.user}`);
            res.send(JSON.stringify({ data: req.session }));
        }
    });
    // * Gets the last 10 posts from the db if the user is signed in
    app.get("/api/posts/:number/:location", function (req, res) {
        // Checks for session, if none, return 401
        const n = Number(req.params.number);
        const l = req.params.location;
        console.log(l);
        if (!req.session.user) {
            res.sendStatus(401);
            return;
        } else {
            // If signed in, return last 10 posts
            const find = Post.find({ location: l })
                .sort({ createdAt: -1 })
                .limit(n);
            find.exec(function (err, posts) {
                if (err) {
                    console.log(err);
                }
                res.send(JSON.stringify(posts));
            });
        }
    });
    //returns messages received by id
    app.get("/api/messages/inbox/:id", function (req, res) {
        const user = req.params.id;
        const find = Message.find({ recipientId: user }).sort({ createdAt: -1 });
        find.exec(function (err, messages) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
            } else {
                console.log("Received request for inbox.");
                console.log(messages);
                res.send(JSON.stringify(messages));
            }
        });
    });
    //makes a new message
  app.post("/api/messages", function(req, res) {
    const newMessage = {
      senderId: req.body.senderId,
      senderName: req.body.senderName,
      recipientId: req.body.recipientId,
      recipientName: req.body.recipientName,
      subject: req.body.subject,
      content: req.body.content,
    };
    console.log(newMessage);
    Message.create(newMessage, function(err, post) {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      } else {
        const messageId = post._id;
        User.findOneAndUpdate(
          {
            _id: newMessage.senderId,
          },
          { $push: { messages: messageId } },
          function(err) {
            if (err) {
              res.sendStatus(500);
              console.log(err);
            } else {
              User.findOneAndUpdate(
                {
                  _id: newMessage.recipientId,
                },
                { $push: { messages: messageId } },
                function(err) {
                  if (err) {
                    res.sendStatus(500);
                    console.log(err);
                  } else {
                    console.log("Message successfully added!");
                    res.sendStatus(200);
                  }
                }
              );
            }
          }
        );
      }
    });
  });
}