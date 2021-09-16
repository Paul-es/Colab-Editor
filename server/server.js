const mongoose = require("mongoose");
const Document = require("./document");

async function main(){

 await mongoose.connect("mongodb+srv://paules:paulelias@cluster0.ahlfn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
}
main()

const io = require("socket.io")(process.env.PORT || 3001, {
  cors: {
    origin: "http://colabtext.netlify.app",
    //origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
});

const defaultValue = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      //console.log(delta)
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({ _id: id, data: defaultValue });
}
