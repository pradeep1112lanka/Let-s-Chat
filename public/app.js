// Firebase and WebRTC setup
const servers = {
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302']
      }
    ]
  };
  const db = firebase.firestore();
  let peerConnection = null;
  let localStream = null;
  let remoteStream = null;
  let roomRef = null;
  let roomId = null;
  
  const localVideo = document.querySelector('#localVideo');
  const remoteVideo = document.querySelector('#remoteVideo');
  
  // Get local media (video/audio) for the caller
  async function openUserMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream;
    localStream = stream;
  
    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;
  
    console.log('Stream opened');
  }
  
  // Create a new WebRTC room and save the offer to Cloud Firestore
  async function createRoom() {
    console.log('Create room initiated');
    peerConnection = new RTCPeerConnection(servers);
  
    // Set up streams
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
    };
  
    // ICE candidates
    const roomRef = await db.collection('rooms').add({});
    roomId = roomRef.id;
    document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the caller!`;
  
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
  
    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      }
    };
    await roomRef.set(roomWithOffer);
  
    // Listen for answer and remote ICE candidates
    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data?.answer) {
        const answer = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(answer);
      }
    });
  
    collectIceCandidates(roomRef, peerConnection, 'callerCandidates', 'calleeCandidates');
  }
  
  // Join an existing room by ID and save the answer to Cloud Firestore
  async function joinRoom(roomId) {
    console.log(`Joining room ${roomId}`);
    peerConnection = new RTCPeerConnection(servers);
  
    // Set up streams
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
    };
  
    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnapshot = await roomRef.get();
    const roomData = roomSnapshot.data();
  
    if (roomData?.offer) {
      const offer = new RTCSessionDescription(roomData.offer);
      await peerConnection.setRemoteDescription(offer);
  
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
  
      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      };
      await roomRef.update(roomWithAnswer);
    }
  
    // Listen for remote ICE candidates
    collectIceCandidates(roomRef, peerConnection, 'calleeCandidates', 'callerCandidates');
  }
  
  // Collect ICE candidates from both caller and callee and add them to Firestore
  async function collectIceCandidates(roomRef, peerConnection, localName, remoteName) {
    const candidatesCollection = roomRef.collection(localName);
  
    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        const json = event.candidate.toJSON();
        candidatesCollection.add(json);
      }
    });
  
    roomRef.collection(remoteName).onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  }
  
  // Button click handlers
  document.querySelector('#createRoom').addEventListener('click', async () => {
    await openUserMedia();
    await createRoom();
  });
  
  document.querySelector('#joinRoom').addEventListener('click', async () => {
    await openUserMedia();
    const roomId = prompt('Enter room ID:');
    await joinRoom(roomId);
  });
  