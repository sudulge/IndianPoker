const express = require("express");
const { truncate } = require("fs");
const http = require("http")
const app = express();
const path = require("path")
const server = http.createServer(app);
const socketIO = require("socket.io")

let readycount = 0
let cardlist = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10]
let player0card = 0
let player1card = 0
let turncount = -1 //만약에 순서정하는 기능 추가하면 -1,0 조정
let realturncount = 1 //내가 먼저 배팅인지 나중 배팅인지(배트,콜)
let round = 0
let player0balance = 30
let player1balance = 30
let pot = 0
let player0bet = 0
let player1bet = 0
let player0totalbet = 0
let player1totalbet = 0
let player0poorallin = false
let player1poorallin = false
let drawround = false

function reset() {
    readycount = 0
    cardlist = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10]
    player0card = 0
    player1card = 0
    turncount = -1 //만약에 순서정하는 기능 추가하면 -1,0 조정
    realturncount = 1 //내가 먼저 배팅인지 나중 배팅인지(배트,콜)
    round = 0
    player0balance = 30
    player1balance = 30
    pot = 0
    player0bet = 0
    player1bet = 0
    player0totalbet = 0
    player1totalbet = 0
    player0poorallin = false
    player1poorallin = false
    drawround = false
    io.emit('reset_user')
    if (players.length==2){
        update()
    }
}


function shuffle(array) { // 피셔-예이츠 셔플
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); 
        [array[i], array[j]] = [array[j], array[i]];
    }
    deal()
}

function deal() {
    if (!drawround){
        pot = 0
    }
    player0bet = 0
    player1bet = 0
    player0totalbet = 0
    player1totalbet = 0
    player0poorallin = false
    player1poorallin = false
    drawround = false
    if (cardlist.length != 0){
        player0card = cardlist.pop()
        player1card = cardlist.pop()
        io.to(players[0]).emit('deal', player1card)
        io.to(players[1]).emit('deal', player0card)
    }else{
        send("카드가 다 떨어졌습니다. 초기화를 눌러주세요")
        return
    }
    turn()
}

function turn() {
    turncount += 1
    round += 1

    if (turncount%2==0){
        io.to(players[0]).emit('my_turn')
        io.to(players[1]).emit('oppo_turn')
    }
    if (turncount%2==1) {
        io.to(players[0]).emit('oppo_turn')
        io.to(players[1]).emit('my_turn')
    }
    update()
}

function update(){
    io.to(players[0]).emit('update', {oppocard: player1card, round: round, cardlength: cardlist.length, pot:pot, mybet: player0bet, oppobet: player1bet, mybalance: player0balance, oppobalance: player1balance})
    io.to(players[1]).emit('update', {oppocard: player0card, round: round, cardlength: cardlist.length, pot:pot, mybet: player1bet, oppobet: player0bet, mybalance: player1balance, oppobalance: player0balance})
}


function showdown() {
    if (player0card>player1card){ //player0승리죠
        if (player0poorallin) {
            player0balance += player0totalbet*2
            player1balance += player1totalbet-player0totalbet
            turncount = -1
        }else{
            player0balance += pot
            turncount = -1
        }

    }
    if (player1card>player0card){ //player1승리죠
        if (player1poorallin){
            player1balance += player1totalbet*2
            player0balance += player0totalbet-player1totalbet
            turncount = 0
        }else{
            player1balance += pot
            turncount = 0
        }
    }
    if (player0card==player1card){
        drawround = true
    }
    update()

    if (player0balance<=0){
        send("player0 패배, 다시하시려면 초기화를 눌러주세요")
        io.emit('oppo_turn')
        update()
        return
    }
    if (player1balance<=0){
        send("player1 패배, 다시하시려면 초기화를 눌러주세요")
        io.emit('oppo_turn')
        update()
        return
    }
    deal()
}

function send(msg){
    io.to("채팅방 1").emit("chatting", {name:"시스템", msg:msg})
}

const io = socketIO(server);

app.use(express.static(path.join(__dirname, "src")))
const PORT = process.env.PORT || 5000;

// class Player{
//     constructor(socket){
//         this.socket = socket;
//     }
//     get id() {
//         return this.socket.id
//     }
// }

let players = []
// let playerMap = {}

// function joinGame(socket){
//     let player = new Player(socket);
//     players.push(player);
//     playerMap[socket.id] = player

//     return player
// }

function endGame(socket){
    for(let i=0; i<players.length; i++){
        if(players[i]==socket.id){
            players.splice(i,1);
            break
        }
    }
    // delete playerMap[socket.id];
}


io.on("connection", (socket)=>{
    reset()
    console.log(`${socket.id}님이 입장하셨습니다.`)
    socket.join("채팅방 1")

    players.push(socket.id)

    socket.on('disconnect', (reason)=>{
        console.log(`${socket.id}님이 ${reason}의 이유로 퇴장하셨습니다.`)
        endGame(socket)
        socket.broadcast.emit('leave_user', socket.id)
    });

    // let newPlayer = joinGame(socket)
    socket.emit('user_id', socket.id)

    for (let i=0; i<players.length;  i++){
        let player = players[i]
        socket.emit('join_user', {
            id: player.id
        })
    }

    socket.broadcast.emit('join_user', {
        id: socket.id
    })

    socket.on('send_action', (data)=>{
        //플레이어 행동
    })

    socket.on("chatting", (data, roomname)=>{
        console.log(data)
        io.to(roomname).emit("chatting", data)
        //io.emit("chatting", data)
    })


    socket.on('joinRoom', (roomname, roomToJoin)=>{
        socket.leave(roomname)
        socket.join(roomToJoin)
    
        socket.emit('roomChanged', roomToJoin)
    })


    let host = players[0].id;
    socket.on('ready', (data)=>{
        if (readycount == 0){
            readycount += 1
            return
        }
        if (readycount == 1){
            readycount += 1
            io.to(players[0]).emit('ready_user', {msg:"당신은 방장입니다. 게임시작을 눌러주세요", bool:false}) //호스트의 준비버튼을 게임시작으로 변경
            io.to(players[1]).emit('ready_user', {msg:"방장이 곧 게임을 시작합니다", bool:true})
            return
        }
        if (readycount == 2){
            send('게임 시작!')
            shuffle(cardlist)
            return 
            //게임 시작
        }
    })

    socket.on('bet', (betinput)=>{
        if(turncount%2==0){
            player0bet = Number(betinput)
            player0totalbet += Number(betinput)
            player0balance -= Number(betinput)
        }
        if(turncount%2==1){
            player1bet = Number(betinput)
            player1totalbet += Number(betinput)
            player1balance -= Number(betinput)
        }
        pot += Number(betinput)
        turn()
    })

    socket.on('call', ()=>{
        if (turncount%2==0){
            player0bet = player1bet
            player0totalbet += player1bet
            player0balance -= player1bet
            pot += player1bet
        }
        if (turncount%2==1){
            player1bet = player0bet
            player1totalbet += player0bet
            player1balance -= player0bet
            pot += player0bet
        }
        showdown()
    })

    socket.on('bet_allin', ()=>{
        if (turncount%2==0) {
            player0bet = player0balance
            player0totalbet += player0balance
            pot += player0balance
            player0balance = 0
        }
        if (turncount%2==1){
            player1bet = player1balance
            player1totalbet += player1balance
            pot += player1balance
            player1balance = 0
        }
        turn()
    })

    socket.on('allin', ()=>{
        if (turncount%2==0) {
            if (player0balance<player1bet){
                //poor allin
                player0poorallin = true
            }
            player0bet = player0balance
            player0totalbet += player0balance
            pot += player0balance
            player0balance = 0
        }
        if (turncount%2==1){
            if (player1balance<player0bet){
                //poor allin
                player1poorallin = true
            }
            player1bet = player1balance
            player1totalbet += player1balance
            pot += player1balance
            player1balance = 0
        }
        showdown()
    })

    socket.on('die', ()=>{
        if (turncount%2==0){
            if (player0card==10){
                player0balance -= 10
                pot += 10
            }
            player1balance += pot
        }
        if (turncount%2==1){
            if (player1card==10){
                player1balance -= 10
                pot += 10
            }
            player0balance += pot
        }
        deal()
    })

    socket.on('reset', ()=>{
        reset()
    })
});



server.listen(PORT, ()=>console.log(`server is running ${PORT}`))
