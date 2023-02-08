// ==UserScript==
// @name         New Diep.io chat + users minimap
// @namespace    http://tampermonkey.net/
// @version      1
// @description  made by tariteur
// @author       tariteur
// @match        https://diep.io/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=diep.io
// @require      https://greasyfork.org/scripts/456843-diep-shortcut/code/diep_Shortcut.js?version=1144520
// @require      https://raw.githubusercontent.com/tariteur/DiepAPI-remix/main/diepAPI.js
// @grant        none
// ==/UserScript==
const { Canvas } = window.diep_Shortcut.core;
const { Vector, CanvasKit } = window.diepAPI.core;
const { scaling, player, game, minimap, arena } = window.diepAPI.apis;
const { backgroundOverlay } = window.diepAPI.tools;
const canvas = document.getElementById('canvas');
const ctx2 = canvas.getContext("2d");
const ctx = backgroundOverlay.ctx;

class Player_count {
  constructor() {
    this._connect();
  }
  _connect() {
    this._socket = new WebSocket(
      "wss://gravel-slender-spectroscope.glitch.me/"
    );
    this._socket.binaryType = "arraybuffer";
    this._socket.addEventListener("message", (e) => this._onmessage(e));
    this._socket.addEventListener("open", (e) => this._onopen(e));
    this._socket.addEventListener("close", (e) =>
      setTimeout(() => this._connect(), 100)
    );
  }
  _onopen() {
    // Send the server our name
    this._socket.send(
      new TextEncoder().encode(
        JSON.stringify({ type: "playerName", playerName: name })
      )
    );
  }
  _score(Score) {
    // Send the server our score
    this._socket.send(
      new TextEncoder().encode(
        JSON.stringify({ type: "Playerscore", Playerscore: Score })
      )
    );
  }
  _position() {
    // Send the server our score
    this._socket.send(
      new TextEncoder().encode(
        JSON.stringify({ type: "PlayerPos", PlayerPos: player.position })
      )
    );
  }
  _chatSend(text) {
    // Send the server our name
    this._socket.send(
      new TextEncoder().encode(
        JSON.stringify({ type: "chat", playerName: localStorage.name, chat: text })
      )
    );
  }
  _onmessage(e) {
    const receive = JSON.parse(new TextDecoder().decode(e.data));
    if (receive.type === "playerList") {
      playersList = receive.players;
      playersScore = receive.score;
      // Update the player count GUI element
      Canvas.GUI_changeName("userCount", `User: ${receive.playerCount}`);
      document.getElementById("userCount").click();
      document.getElementById("userCount").click();
    } else if (receive.type === "PlayerPos") {
      PlayerPos.push(receive);
    } else if (receive.type === "chat") {
      displayChat(receive.players, receive.text);
    }
  }
}
let player_count = new Player_count();

/////// userCount
Canvas.GUI_create("userCount", "button", "User: 0", 97+"%", 76+"%", 6, 3, "#adadad", 2, 1, () => {
    userCountONOFF = ! userCountONOFF;
    let offset = 2.5;
    let modalHeight = 25;
    let highestScore = 0;
    let highestScorer = "";
    let maxScore = 100000;
    if (userCountONOFF) {
      let playersListSorted = {...playersList};
      playersListSorted = Object.entries(playersListSorted).sort((a, b) => playersScore[b[0]] - playersScore[a[0]]);
      for (let [playerID, player] of playersListSorted) {
          if (playersScore[playerID] > highestScore) {
              highestScore = playersScore[playerID];
              highestScorer = player;
          }
          let scoreRatio = playersScore[playerID] / maxScore;
          let red = 255;
          let green = 255 - (255 * scoreRatio);
          let blue = 255 - (255 * scoreRatio);
          let color = `rgb(${red}, ${green}, ${blue})`;
          Canvas.Text_create(`player-name-${playerID}`, "userCount", 73.5, 5 + offset, `${player}`, player == highestScorer ? "gold" : "#FFFFFF");
          Canvas.Text_create(`player-score-${playerID}`, "userCount", 80, 5 + offset, `${playersScore[playerID]}`, color);
          offset += 2.5;
          modalHeight += 20;
      }
      Canvas.GUI_create_Modal("modal", "userCount", 72.5+"%", 4+"%", 11+"vw", modalHeight+"px", "#33333380","#28282880");
      Canvas.GUI_create_Modal("line", "userCount", 79.65+"%", 4.2+"%", 4+"vw", modalHeight+"px", "white");
    } else {
      Canvas.GUI_delete("class", "userCount")
    }
});

////// chat
Canvas.GUI_input_bar("input-bar", "input-class", "Message", 0+"%", 42.5+"%", 10, 2, "black", "2px solid black", 1, function(){
    player_count._chatSend(event.target.value);
    event.target.value = "";
    Canvas.GUI_hide_or_show("id","input-bar");
    setTimeout(() => Canvas.GUI_hide_or_show("id","input-bar"), 1);
});
const messageContainer = document.createElement("div");
messageContainer.style.position = "absolute";
messageContainer.style.left = "10px";
messageContainer.style.top = "35px";
document.body.appendChild(messageContainer);

function displayChat(text, playerName) {
    // Create message element
    const emoticonElement = document.createElement("div");
    emoticonElement.innerHTML = `${text}: ${playerName}`;
    emoticonElement.style.textShadow = "2px 2px 0 black,-2px -2px 0 black";;
    emoticonElement.style.color = "gold";
    emoticonElement.style.fontSize = "20px";
    emoticonElement.style.marginBottom = "5px";
    emoticonElement.style.transition = "opacity 1s";
    messageContainer.insertBefore(emoticonElement, messageContainer.firstChild);

    // Remove oldest message if container has more than 10 children
    if (messageContainer.childElementCount > 20) {
        messageContainer.removeChild(messageContainer.lastChild);
    }

    // Remove message after 10 seconds
    setTimeout(() => {
        emoticonElement.style.opacity = 0;
        setTimeout(() => emoticonElement.remove(), 1000);
    }, 10000);
}

function Playershow(){
PlayerPos.forEach((player) => {
    if (Date.now() - player.time < 10000) {
    const playersMinimapPos = toMinimapPosition(player.PlayerPos);
    ctx2.save();
    ctx2.globalAlpha = 1;
    ctx2.fillStyle = "black";
    ctx2.beginPath();
    ctx2.arc(playersMinimapPos.x, playersMinimapPos.y, 3 * window.devicePixelRatio, 0, 2 * Math.PI);
    ctx2.fill();
    ctx2.restore();
    }
});
}

game.once('ready', () => {
    game.on('frame', () => {
            Playershow()
    });
});
