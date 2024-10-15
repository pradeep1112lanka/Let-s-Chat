import React from 'react'

import { useUserStore } from "../../lib/userStore"
import "./userInfo.css"

const Userinfo = () => {

  const {currentUser} = useUserStore();

  return (
    <div className='userInfo'>
    <div className="user">
    <img src={ currentUser.avatar || "./avatar.png"} alt="" /></div>
    <h2>{currentUser.username}</h2>
    <div className="icons">
    <img src="./more.png" alt = ""/>
    <img src="./video.png" alt = ""/>
    <img src="./edit.png" alt = ""/></div>
    </div>
  )
}

export default Userinfo