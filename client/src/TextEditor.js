import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import Loader from "react-loader-spinner";
import { useParams } from "react-router-dom";

const INTERVAL = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ align: [] }],
];

export default function TextEditor() {
  const [socket, setSocket] = useState();
  const [spin, setSpin] = useState(true);

  const [quill, setQuill] = useState();
  const { id: documentId } = useParams();

  console.log(documentId);

  useEffect(() => {
    const s = io("https://colab-text-editor.herokuapp.com", {
      transports: ["websocket"],
    });
    //const s = io("http://localhost:3001");
    setSocket(s);

    return () => {
      s.disconnet();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);

    };
  }, [socket, quill]);

  // Update document on other client connected
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      quill.off("receive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    async function load() {
      await socket.once("load-document", (document) => {
        quill.setContents(document);
        quill.enable();
        setSpin(false)

      });
      socket.emit("get-document", documentId);
    }
    load();
  }, [socket, quill, documentId]);

  // save the document at paticular interval
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapperRef.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    q.disable();

    setQuill(q);
  }, []);
  return (
    <>

    <div className="container" ref={wrapperRef}>
    {spin ? (
    <Loader
    type="Bars"
    color="#e32b2b"
    height={100}
    width={100}
    className="spinner"
    
  />
    ) :null } 
    </div>
    </>
  );
}
