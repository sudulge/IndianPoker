//"use strict"

// const $oppocard = document.querySelector("#oppo-card")
const $oppocardimg = document.querySelector(".oppocardimg")
const $ready = document.querySelector(".ready")
const $betinput = document.querySelector(".betinput")
const $bet = document.querySelector(".bet")
const $call = document.querySelector(".call")
const $allin = document.querySelector(".allin")
const $die = document.querySelector(".die")
const $reset = document.querySelector(".reset")
const $mybalance = document.querySelector("#mybalance")
const $oppobalance = document.querySelector("#oppobalance")
const $pot = document.querySelector("#pot")
const $mybet = document.querySelector("#mybet")
const $oppobet = document.querySelector("#oppobet")




$ready.addEventListener("click", ()=>{
    socket.emit('ready')
    $ready.disabled = true
})

$bet.addEventListener("click", ()=>{
    if (Number($betinput.value)<=0) {
        console.log("0보다 큰 수를 입력해주세요.")
        return
    }
    if (Number($mybalance.textContent)<=Number($oppobet.textContent)){
        console.log("칩이 부족합니다. 올인이나 다이를 눌러주세요")
        return
    }
    if (Number($betinput.value)<=Number($oppobet.textContent)) {
        console.log("상대보다 많은 칩을 배팅하거나 콜을 눌러주세요")
        return
    }
    if (Number($betinput.value)>=Number($mybalance.textContent)){
        console.log("남은 칩의 수가 1보다 작습니다. 전부 거시려면 올인을 눌러주세요")
        return
    }

    socket.emit('bet', Number($betinput.value))
    $betinput.value = '';
})

$call.addEventListener("click", ()=>{
    if (Number($oppobet.textContent)==0) {
        console.log("처음에는 콜을 할 수 없습니다.")
        return
    }
    if (Number($mybalance.textContent)<=Number($oppobet.textContent)){
        console.log("칩이 부족합니다. 올인이나 다이를 눌러주세요")
        return
    }
    socket.emit('call')
})

$allin.addEventListener("click", ()=>{
    sure = confirm("정말 올인 하시겠습니까?")
    if (!sure){
        return
    }
    if (Number($oppobet.textContent)==0) {
        socket.emit('bet_allin')
        return
    }
    socket.emit('allin')
})

$die.addEventListener("click", ()=>{
    socket.emit('die')
})

$reset.addEventListener("click", ()=>{
    sure = confirm("정말 초기화 하시겠습니까?")
    if (!sure){
        return
    }
    socket.emit('reset')
})

function Player(id){
    this.id = id
}

let players = []
let playerMap = {}
let myid

function joinUser(id){
    let player = new Player(id)

    players.push(player)
    playerMap[id] = player

    return player
}

function leaveUser(id){
    for(let i=0; i<players.length; i++){
        if (players[i].id == id){
            players.splice(i,1);
            break
        }
    }
    delete playerMap[id]
}

function updateState(id){
    let player = playerMap[id];
    if (!player){
        return
    }
    //플레이어정보업데이트
}

function sendData(){
    let curPlayer = playerMap[myid]
    let data = {}
    data = {
        id: curPlayer.id,
        
    }
    if (data){
        socket.emit("send_action", data)
    }
}

function button(bool){
    $bet.disabled = bool
    $call.disabled = bool
    $allin.disabled = bool
    $die.disabled = bool
}

const socket = io();

socket.on('user_id', (data)=>{
    myid = data;
})
socket.on('join_user', (data)=>{
    joinUser(data.id)
})
socket.on('leave_user', (data)=>{
    leaveUser(data)
})
socket.on('update_state', (data)=>{
    updateState(data.id)
})

socket.on('ready_user', (data)=>{
    console.log(data.msg)
    $ready.innerText = "게임시작"
    $ready.disabled = data.bool
    $reset.disabled = data.bool
})

socket.on('reset_user', ()=>{
    $ready.innerText = "준비"
    $ready.disabled = false
    $reset.disabled = true
    button(true)
})

socket.on('update', (stats)=>{
    $oppocardimg.src=`img/${stats.oppocard}.jpg`
    $mybalance.textContent = stats.mybalance
    $oppobalance.textContent = stats.oppobalance
    $pot.textContent = stats.pot
    $mybet.textContent = stats.mybet
    $oppobet.textContent = stats.oppobet
})

socket.on('deal', (oppocard)=>{
    $oppocardimg.src=`img/${oppocard}.jpg`
})

socket.on('my_turn', (stats)=>{
    button(false)
})

socket.on('oppo_turn', (stats)=>{
    button(true)
})



let roomname = "채팅방 1"
const $nickname = document.querySelector("#nickname")
const $chatlist = document.querySelector(".chatting-list")
const $chatInput = document.querySelector(".chatting-input")
const $sendButton = document.querySelector(".send-button")

$chatInput.addEventListener('keypress', (key)=>{
    if(key.key == 'Enter'){
        send()
    }
})


function send(){
    const param = {
        name: $nickname.value,
        msg: $chatInput.value,
    }
    socket.emit("chatting", param, roomname)
    $chatInput.value='';
}

$sendButton.addEventListener("click", send)


socket.on("chatting", (data)=>{
    const li = document.createElement("li")
    li.innerText = `${data.name}:  ${data.msg}`;
    $chatlist.appendChild(li)
})

socket.on('roomChanged', (joinedRoom)=>{
    roomname = joinedRoom
    const li = document.createElement("li")
    li.innerText = joinedRoom + "에 접속했습니다.";
    $chatlist.appendChild(li)

})

function joinRoom() {
    let roomOptions = document.querySelector("#roomoptions")
    let roomToJoin = roomOptions.options[roomOptions.selectedIndex].value

    socket.emit('joinRoom', roomname, roomToJoin)
}
console.log(socket)





//맨처음에 한개씩 배팅하는거 구현
 

//게임 상태창 만들기 (판돈, 남은돈, 올인, 몇번재 턴인지 등..)
//올인 룰 (상대방의 레이즈에 콜 할 칩이 없어서 올인 해야하는경우)
//        (이때 이겼을경우 자기가 건 돈만큼만 가져갈수 있는거)
//올인 했을때 상대 배팅보다 칩이 적을경우 다른 emit보내기 1. oppobet이 mybalance랑 같을때, 2. 더 클때
//다만 상대방보다 적은 금액으로 콜을 하고 게임에서 이길 경우에는
//각각의 플레이어들에게서 자신이 베팅한 금액을 초과하는 금액은 받을
//수 없다.[12] 언제 선언하든 올인한 사람은 추가 액션을 취할 수
//없기에 쇼다운까지 차례 없이 지나간다. ```
//poor allin making
//무승부 만들기

//누군가가 패배했을때 칩은 제대로 되는데 pot,배팅이 0으로 되지않음
//카드 다떨어졌을대구현

//socket.id 활용해서 참여자 목록 구현