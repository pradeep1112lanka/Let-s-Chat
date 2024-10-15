import React from 'react'

import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "../addUser/addUser";
import { useUserStore } from "../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    if (!currentUser?.id) return; // Ensure currentUser.id is defined before proceeding

    const userChatsRef = doc(db, "userchats", currentUser.id);
    
    const unSub = onSnapshot(userChatsRef, async (res) => {
      // Ensure the snapshot exists and contains chat data
      if (!res.exists()) {
        console.error("No chat data found for this user.");
        setChats([]);
        return;
      }

      const items = res.data().chats || []; // Handle empty chats array
      
      const promises = items.map(async (item) => {
        // Use correct casing for recieverId
        if (!item.recieverId) {
          console.error("Item has no recieverId:", item);
          return null; // Skip invalid items
        }

        const userDocRef = doc(db, "users", item.recieverId);
        const userDocSnap = await getDoc(userDocRef);

        // Ensure the user document exists before proceeding
        const user = userDocSnap.exists() ? userDocSnap.data() : null;
        
        if (!user) {
          console.error("No user found with id:", item.recieverId);
          return null;
        }

        return { ...item, user };
      });

      // Wait for all promises to resolve and filter out any null values
      const chatData = (await Promise.all(promises)).filter(chat => chat !== null);

      setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt)); // Sort by updatedAt
    });

    return () => {
      unSub(); // Clean up the snapshot listener on component unmount
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {

    const userChats = chats.map((item)=> {
      const {user,...rest}=item;
      return rest;
    });
    const chatIndex = userChats.findIndex(item => item.chatId===chat.chatId);
    userChats[chatIndex].isseen=true;
    const userChatsRef = doc(db,"userchats",currentUser.id);

    try {
      
      await updateDoc(userChatsRef,{
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);

    } catch (err) {

      console.log(err)
      
    }
  };

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="/search.png" alt="Search Icon" />
          <input type="text" placeholder="Search" />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt="Toggle Add User"
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      {chats.length > 0 ? (
        chats.map((chat) => (
          <div className="item" key={chat.chatId} onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isseen ? "transparent" : "5183fe",
          }}
          >
            <img src={chat.user?.avatar || "./avatar.png"} alt="User Avatar" />
            <div className="texts">
              <span>{chat.user?.username}</span>
              <p>{chat.lastMessage}</p>
            </div>
          </div>
        ))
      ) : (
        <p>No chats available</p>
      )}

      {addMode && <AddUser />}
        <button className="logout" onClick={()=>auth.signOut()}>Logout</button>
    </div>
  );
};

export default ChatList;
