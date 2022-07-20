const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server,  {
    cors: {
      origin: "*"
    }
});
var admin = require("firebase-admin");
var serviceAccount = require("./accessKey.json");
const { FieldValue } = require('firebase-admin/firestore');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore()

const port = process.env.PORT || 1337;

let users = []

app.get('/', (req, res)=>{
    res.send('Server is runing')
})

function findUserByUserId(userId){
    return users.find((user) => user.userId === userId) || false;
}

function findUserBySocketId(socketId){
    return users.find((user) => user.socketId === socketId) || false;
}

function userAlreadyExists(userId){
    return users.some((user)=> user.userId === userId)
}

async function updateLastSeen(userId){
    const userRef = db.collection('users').doc(userId);
    await userRef.update({lastSeen: FieldValue.serverTimestamp()});
}

io.on('connection', (socket) => {

    socket.on('newUser', function(userId){
        const userExistance = userAlreadyExists(userId);
        if(!userExistance){
            users.push({
                socketId: socket.id,
                userId: userId,
            })
            console.log(users)
        }
        io.emit('online', users)
    })    
    
    socket.on('new message', (recipientUserId)=>{
        const recipientUser = findUserByUserId(recipientUserId)
        if(!recipientUser) return
        
        socket.to(recipientUser.socketId).emit('return message', 'new_message')
    })

    socket.on('typing', ({currentUserId, recipientUserId})=>{
        const recipientUser = findUserByUserId(recipientUserId)
        io.to(recipientUser.socketId).emit('istyping', {typing: true})
    })

    socket.on('stop typing', ({currentUserId, recipientUserId})=>{
        const recipientUser = findUserByUserId(recipientUserId)
        io.to(recipientUser.socketId).emit('istyping', {typing: false})
    })

    socket.on("disconnect", async () => {
        const disUser = findUserBySocketId(socket.id)
        if(disUser.userId){
            updateLastSeen(disUser.userId)
        }
        users = users.filter(user=> user.socketId !== socket.id)
        io.emit('online', users)
    });
});

server.listen(port, () => {
    console.log('listening on *:1337');
});