const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
  },
});

const port = process.env.PORT || 1337;

let users = []

function findUserByUserId(userId){
    return users.find((user) => user.userId === userId) || false;
}

function userAlreadyExists(userId){
    return users.some((user)=> user.userId === userId)
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

    socket.on("disconnect", async () => {
        users = users.filter(user=> user.socketId !== socket.id)
        io.emit('online', users)
    });
});

httpServer.listen(port, () => {
    console.log('listening on *:1337');
});