const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "https://whatsapp-ivory.vercel.app/",
  },
});

const port = 1337;

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
        
    })
    
    socket.on('new message', (recipientUserId)=>{
        const recipientUser = findUserByUserId(recipientUserId)
        if(!recipientUser) return
        
        io.to(recipientUser.socketId).emit('return message',{ message: 'new_message' });
    })

    
    socket.on('get user', ({userId, recipientUserId})=>{
        console.log('get user')
        const user = findUserByUserId(userId);
        const recipientUser = findUserByUserId(recipientUserId);
        if(recipientUser){
            io.to(user.socketId).emit('myUser', {status: true})
        }else{
            io.to(user.socketId).emit('myUser', {status: false})
        }
    })
    
    socket.on("disconnect", async () => {
        users = users.filter(user=> user.socketId !== socket.id)
        
    });
});

httpServer.listen(port, () => {
    console.log('listening on *:1337');
});