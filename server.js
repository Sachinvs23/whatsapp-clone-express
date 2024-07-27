const express = require("express");
const mongoose = require("mongoose");
const Rooms = require("./dbRooms");
const cors = require("cors");
const Messages = require("./dbMessages");
const Pusher = require("pusher");


const pusher = new Pusher({
  appId: "1839898",
  key: "0a910cc64eb9b7d77a47",
  secret: "1a2473b00b75f32c9e7c",
  cluster: "ap2",
  useTLS: true
});

const app = express();
app.use(express.json());
app.use(cors());

const dbUrl =
  "mongodb+srv://sachinvs328:NdKbgk48WqgQJP50@streamapps.5iausox.mongodb.net/whatsappClone?retryWrites=true&w=majority&appName=StreamApps";

mongoose.connect(dbUrl);

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");
  const roomCollection = db.collection("rooms");
  const changeStream = roomCollection.watch();

  changeStream.on("change",(change)=> {
    if(change.operationType === "insert"){
      const roomDetails = change.fullDocument;
      pusher.trigger("room", "inserted", roomDetails);
    } else {
      console.log("not expected event to trigger");
    }
  });

  const messagesCollection = db.collection("messages");
  const changeStream1 = messagesCollection.watch();

  changeStream1.on("change",(change)=> {
    if(change.operationType === "insert"){
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", messageDetails);
    } else {
      console.log("not expected event to trigger");
    }
  })
});

app.get("/", (req, res) => {
  res.send("Hello from backend");
});

app.post("/messages/new",(req,res)=>{
  const dbMessage = req.body;
  Messages.create(dbMessage)
  .then((result)=>{
    return res.status(201).send(result)
  })
  .catch((err) => {
    return res.status(500).send(err);
  });
});

app.post("/group/create", (req, res) => {
  const name = req.body.groupName;
  Rooms.create({ name })
    .then((result) => {
      return res.status(201).send(result);
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
});

app.get("/all/rooms", (req,res)=>{
  Rooms.find({})
  .then((result)=>{
    return res.status(200).send(result);
  })
  .catch((err)=>{
    return res.status(500).send(err);
  });
});

app.get("/room/:id",(req,res)=>{
  Rooms.find({_id:req.params.id})
  .then((result)=>{
    return res.status(200).send(result[0]);
  })
  .catch((err)=>{
    return res.status(500).send(err);
  });
});

app.get("/messages/:id",(req,res)=>{
  Messages.find({roomId:req.params.id})
  .then((result)=>{
    return res.status(200).send(result);
  })
  .catch((err)=>{
    return res.status(500).send(err);
  });
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log("Server is up and running");
});
