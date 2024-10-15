import React, { useEffect, useState, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import upload from "../../lib/upload";

// WebRTC configuration
const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302", // Google STUN server
    },
  ],
};

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const { chatId, user } = useChatStore();
  const { currentUser } = useUserStore();
  const endRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // State to manage video call visibility and state
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [callState, setCallState] = useState("idle"); // Call state management

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    if (!chatId) return;
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      if (res.exists()) {
        setChat(res.data());
      } else {
        console.error("Chat not found for chatId:", chatId);
        setChat(null);
      }
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  // Handle sending text messages
  const handleSend = async () => {
    if (text.trim() === "" && !img.file) return; // Don't send if message is empty

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text: text.trim(), // Ensure no leading/trailing whitespace
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }), // Add image URL if exists
        }),
      });

      // Update user chats
      const userIds = [currentUser.id, user.id];
      for (const id of userIds) {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

          userChatsData.chats[chatIndex].lastMessage = text.trim() || "Image"; // Handle empty text
          userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
          userChatsData.chats[chatIndex].updatedAt = Date.now();

          await updateDoc(userChatsRef, { chats: userChatsData.chats });
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }

    // Reset state after sending
    setImg({ file: null, url: "" });
    setText(""); // Ensure the text field is cleared after sending
  };

  // Handle starting a video call
  const handleStartVideoCall = async () => {
    setIsVideoCallActive(true); // Show video call section
    setCallState("calling"); // Update call state
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      localVideoRef.current.srcObject = localStream;

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await setDoc(doc(db, "calls", chatId), { offer });

      const callDoc = doc(db, "calls", chatId);
      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.answer && !peerConnection.currentRemoteDescription) {
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState("inCall"); // Update call state
        }
        if (data?.iceCandidates) {
          data.iceCandidates.forEach((candidate) => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          });
        }
      });

      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          const candidateData = {
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
          };
          await updateDoc(callDoc, {
            iceCandidates: arrayUnion(candidateData),
          });
        }
      };
    } catch (error) {
      console.error("Error starting video call:", error);
      setCallState("idle"); // Reset call state on error
    }
  };

  // Handle incoming calls
  useEffect(() => {
    const callDoc = doc(db, "calls", chatId);
    const unSub = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.offer) {
        setCallState("incoming"); // Update call state when there's an incoming call
      }
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  // Handle answering a call
  const handleAnswerCall = async () => {
    const callDoc = doc(db, "calls", chatId);
    const data = await getDoc(callDoc);

    if (data.exists() && data.data().offer) {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.data().offer));

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        await setDoc(callDoc, { answer });
        setCallState("inCall"); // Update call state when call is answered
      }
      setIsVideoCallActive(true); // Show video call section when the call is answered
    }
  };

  // Handle ending the video call
  const handleEndVideoCall = () => {
    setIsVideoCallActive(false); // Hide video call section

    // Stop all video and audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close the peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null; // Clean up the reference
    }

    setCallState("ended"); // Update call state when call ends
    // Optionally remove call document from Firestore
    // await deleteDoc(doc(db, "calls", chatId));
  };

  // Handle image upload
  const handleImg = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImg({ file, url: URL.createObjectURL(file) });
    }
  };

  // Handle emoji picker visibility
  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji.emoji);
  };

return (
  <div className="chat">
    <div className="top">
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="User Avatar" />
        <div className="texts">
          <span>{user?.username || "Unknown User"}</span>
          <p>{user?.status || "No status"}</p>
        </div>
      </div>
      <div className="icons">
        <img src="./phone.png" alt="Audio Call" />
        <img src="./video.png" alt="Video Call" onClick={handleStartVideoCall} /> {/* Video call button */}
        <img src="./info.png" alt="Info" />
      </div>
    </div>

    <div className="center">
      {chat?.messages?.map((message, index) => (
        <div className={`message ${message.senderId === currentUser.id ? "own" : ""}`} key={index}>
          {message.img && <img src={message.img} alt="sent" className="sent-image" />} {/* Display image */}
          <div className="texts">
            <p>{message.text}</p>
          </div>
        </div>
      ))}
      
      {img.url && (
        <div className="message own">
          <div className="texts">
            <img src={img.url} alt="preview" className="sent-image" />
          </div>
        </div>
      )}
      <div ref={endRef} /> {/* Scroll to this element */}
    </div>

    <div className="bottom">
      <div className="icons">
        <label htmlFor="file">
          <img src="./img.png" alt="Upload" />
        </label>
        <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} />
        <img src="./camera.png" alt="Camera" />
        <img src="./mic.png" alt="Mic" />
      </div>
      <input
        type="text"
        placeholder="Type a message ..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="emoji">
        <img src="./emoji.png" alt="Emoji" onClick={() => setOpen((prev) => !prev)} />
        {open && (
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={(emoji) => setText((prev) => prev + emoji.emoji)} />
          </div>
        )}
      </div>
      <button onClick={handleSend}>Send</button>
    </div>

    <button onClick={handleAnswerCall}>Answer Call</button>
    {isVideoCallActive && (
      <div className="video-call">
        <video ref={localVideoRef} autoPlay muted />
        <video ref={remoteVideoRef} autoPlay />
        <button onClick={handleEndVideoCall}>End Call</button>
      </div>
    )}
  </div>
);
};

export default Chat;
