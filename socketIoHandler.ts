import { Server, Socket, type DisconnectReason, type ServerOptions } from 'socket.io';
import { empty } from 'svelte/internal';
import type { GameStateData, PlayerData, Settings, TeamData } from './types';

/**
 * @param {Partial<import("socket.io").ServerOptions> | undefined} server
 */
export default function injectSocketIO(server: Partial<ServerOptions> | undefined) {
    type ConnectionResponse = {isConnected: boolean, gamestate?:GameStateData}
    
    class Room{
        roomId: number;
        settings: Settings;
        gameState: GameState;
        hostId: string;
        constructor(roomId:number, hostId:string){
            if(roomId != null && rooms[roomId] == undefined) this.roomId = roomId;
            else{
                do{
                this.roomId = Math.floor(Math.random()*999999);
                }while(rooms[this.roomId] != undefined)
            }
            this.gameState = new GameState;
            this.settings = {shouldBounce:true, tournamentStyleBounce: false, shouldLock:true, autoClear:true, timerDuration:10000};
            this.hostId = hostId;
        }
    }

    class GameState implements GameStateData {
        team1: Team;
        team2: Team;
        teamNull: {[index:string]: Player};
        buzzedList: {[index:string]: Player};
        constructor(){
            this.team1 = new Team(1);
            this.team2 = new Team(2);
            this.teamNull = {};
            this.buzzedList = {};
        }

        public addPlayer(player:Player) {
            this.teamNull[player.id] = player;
        }

        public movePlayer(player:Player, teamNumber:0|1|2){
            if(teamNumber == 1)this.team1.addPLayer(player);
            else this.team2.addPLayer(player);

            if(player.teamNumber == 0) delete this.teamNull[player.id];
            else if (player.teamNumber == 1) this.team1.removePlayer(player);
            else  this.team2.removePlayer(player);

            player.teamNumber = teamNumber;   
        }

        public buzz(player:Player, time:number){
            if(!player.isBuzzed && !player.isLocked){
                this.buzzedList[time] = player;
                player.isBuzzed = true;
            }
        }

        public clearBuzz(){
            this.buzzedList = {};
            Object.values(this.team1.playerList).forEach(player => {
                player.isBuzzed = false;
                player.isLocked = false;
            });
            Object.values(this.team2.playerList).forEach(player => {
                player.isBuzzed = false;
                player.isLocked = false;
            });
            Object.values(this.teamNull).forEach(player =>{
                player.isBuzzed = false;
                player.isLocked = false;
            })
            this.team1.isLocked = false;
            this.team2.isLocked = false;
        }

        public removePlayer(player:Player){
            if(player.teamNumber != 0) (player.teamNumber == 1 ? this.team1 : this.team2).removePlayer(player);
            else delete this.teamNull[player.id];

            Object.entries(this.buzzedList).forEach(entry =>{
                if(entry[1] == player) delete this.buzzedList[entry[0]];
            })
        }

        public clearAndLock(player:Player){
            if(player.teamNumber == 1){
                this.team1.isLocked = true;
                Object.entries(this.buzzedList).forEach(entry =>{
                    if(entry[1].teamNumber == 1){
                        delete this.buzzedList[entry[0]];
                    }
                })
                Object.values(this.team1.playerList).forEach(player => {
                    player.isBuzzed = false;
                    player.isLocked = true;
                });
            }
            else if (player.teamNumber == 2){
                this.team2.isLocked = true;
                Object.entries(this.buzzedList).forEach(entry =>{
                    
                    if(entry[1].teamNumber == 2) {
                        delete this.buzzedList[entry[0]];
                    }
                })
                Object.values(this.team2.playerList).forEach(player => {
                    player.isBuzzed = false;
                    player.isLocked = true;
                });
            }
        }
        
        public setLockAll(shouldLock:boolean){
            this.buzzedList = {};

            this.team1.isLocked = shouldLock;
            this.team2.isLocked = shouldLock;
            
            Object.values(this.team1.playerList).forEach(player => {
                player.isBuzzed = false;
                player.isLocked = shouldLock;
            })
            Object.values(this.team2.playerList).forEach(player => {
                player.isBuzzed = false;
                player.isLocked = shouldLock;
            });
            Object.values(this.teamNull).forEach(player =>{
                player.isBuzzed = false;
                player.isLocked = shouldLock;
            })
        }
    }


    class Team implements TeamData {
        teamNumber:0|1|2;
        points: number;
        playerList: {[index:string]: Player};
        isLocked: boolean;
        constructor(teamNumber:0|1|2) {
            this.teamNumber = teamNumber
            this.points = 0;
            this.playerList = {};
            this.isLocked = false;
        }

        public addPLayer(player:Player){
            this.playerList[player.id] = player; 
        }

        public removePlayer(player:Player){
            delete this.playerList[player.id]
        }

        public score(player:Player, points:number, isOverride:boolean){
            this.points += points;
            player.score(points, isOverride);
        }

        public teamScore(points:number){
            this.points += points;
        }
    }

    class Player implements PlayerData {
        points: number;
        timesBuzzed: number;
        negFives: number;
        power: number;
        id: string;
        name: string;
        isLocked: boolean;
        isBuzzed: boolean;
        roomId: number;
        latency: number = 0;
        teamNumber: 0|1|2;
        constructor(id:string, name:string, roomId:number){
            this.points = 0;
            this.timesBuzzed = 0;
            this.negFives = 0;
            this.power = 0;
            this.id = id;
            this.name = name;
            this.isLocked = false;
            this.isBuzzed = false;
            this.roomId = roomId;
            this.teamNumber = 0;
        }

        public score(points:number, isOverride:boolean){
            this.points += points;
            if(points == -5 && !isOverride)this.negFives += 1;
            else if (points == 15 && !isOverride)this.power += 1;
        }
    }


    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:9357", "http://localhost:9351"]
        }
    });

    const rooms:{[index:number]: Room} = {};
    const players:{[index:string]: Player} = {};

    setInterval(() => {
        Object.keys(players).forEach((socketid) => {
            ping(io.sockets.sockets.get(socketid)!)
        })
    }, 1000 )
    function ping(socket:Socket) {
        if (socket == null) {return;}
        const start = Date.now()
        socket.emit("ping", ()=>{
            players[socket.id].latency = (Date.now() - start) / 2
            socket.emit("latency", players[socket.id].latency)
        });
    }
    io.on('connection', (socket) => {

        socket.on("disconnect", ()=>{
            const player:Player = players[socket.id];
            if(player != undefined){
                console.log("player disconnectiong")
                console.log(player);
                const gameState:GameState = rooms[player.roomId].gameState;
                gameState.removePlayer(player);

                delete players[socket.id];
                sendUpdate(player.roomId)
            }
            else {
                let roomId:number;
                Object.entries(rooms).forEach(entries =>{
                    if(entries[1].hostId == socket.id){
                        roomId = parseInt(entries[0]);
                    }
                })
                if(typeof roomId! !== 'undefined'){
                    const gameState:GameState = rooms[roomId!].gameState;
            
                    Object.values(gameState.team1.playerList).forEach(player => {
                        delete players[player.id];
                        io.sockets.sockets.get(player.id)?.disconnect();
                    });
                    Object.values(gameState.team2.playerList).forEach(player => {
                        delete players[player.id];
                        io.sockets.sockets.get(player.id)?.disconnect();
                    });
                    Object.values(gameState.teamNull).forEach(player =>{
                        delete players[player.id];
                        io.sockets.sockets.get(player.id)?.disconnect();
                    })
                
                    delete rooms[roomId!];
                }
            }
        })

        socket.on("login", (data: {name:string; roomId:number}, callback: (success:ConnectionResponse) => void)=>{
            
            const response: ConnectionResponse= {isConnected: false}
            if(rooms[data.roomId] != undefined){
                response.isConnected = true;
                response.gamestate = rooms[data.roomId].gameState
                socket.join(data.roomId.toString());
                const player = new Player(socket.id, data.name, data.roomId);
                players[socket.id] = player;
                rooms[data.roomId].gameState.addPlayer(player);
                sendUpdate(data.roomId)
                ping(socket)   
            }
            callback(response)
        })

        socket.on("hostLogin", (data:{roomId:number}, callback:(data:{roomId:number, settings:Settings})=>void)=>{
           
            const room = new Room(data.roomId, socket.id);
            rooms[room.roomId] = room;
            socket.join(room.roomId.toString());
            socket.join((room.roomId.toString() + "host"));
            callback({roomId:room.roomId, settings:room.settings})
        })

        socket.on("renamePlayer", (id:string, name:string) => {
            const player= players[id];
            player.name = name;
            sendUpdate(player.roomId)
        })

        socket.on("kickPlayer", (id:string) => {
            const player:Player = players[id];
            const gameState:GameState = rooms[player.roomId].gameState;

            gameState.removePlayer(player);

            delete players[id];

            io.sockets.sockets.get(id)?.disconnect()
            sendUpdate(player.roomId)
        })

        socket.on("buzz", ()=>{
            const player = players[socket.id];
            const gameState = rooms[player.roomId].gameState;
            player.timesBuzzed += 1;
            gameState.buzz(player, Date.now()-(player.latency));
            sendUpdate(player.roomId)
            io.to(player.roomId.toString()).emit("buzzNoise");
        })

        socket.on("movePlayer", (data:{playerId:string, teamNumber:0|1|2})=>{
            const player = players[data.playerId];
            const gameState = rooms[player.roomId].gameState;
            gameState.movePlayer(player, data.teamNumber);
            sendUpdate(player.roomId)
        })

        socket.on("incrementScore", (data:{playerId:string, score:number, isOverride:boolean})=>{
            const player = players[data.playerId];
            const gameState = rooms[player.roomId].gameState;
            if (player.teamNumber != 0)(player.teamNumber == 1?gameState.team1:gameState.team2).score(player, data.score, data.isOverride);
            else(player.score(data.score, data.isOverride));
            if(!data.isOverride){
                if(rooms[player.roomId].settings.shouldLock && data.score <= 0){
                    gameState.clearAndLock(player);
                }
                if(rooms[player.roomId].settings.autoClear){
                    if(data.score > 0) gameState.clearBuzz();
                    else player.isLocked = true;
                    if(rooms[player.roomId].settings.shouldLock && gameState.team1.isLocked && gameState.team2.isLocked){
                        gameState.clearBuzz();
                    }
                    
                    Object.entries(gameState.buzzedList).forEach((entries) =>{
                        if(entries[1] == player) delete Object.keys(gameState.buzzedList)[0];
                    })
                }
    
            }
            sendUpdate(player.roomId)
        })

        socket.on("incrementTeamScore", (data:{roomId:number, teamId:1|2, score:number})=>{
            let gameState = rooms[data.roomId].gameState;
            if(data.teamId == 1)gameState.team1.teamScore(data.score);
            else gameState.team2.teamScore(data.score);
            sendUpdate(data.roomId);
        })

        socket.on("setBuzzerLock", (roomId:number, shouldLock:boolean)=>{
            rooms[roomId].gameState.setLockAll(shouldLock)
            sendUpdate(roomId)
        })

        socket.on("clearBuzz", (roomId:number)=>{
            rooms[roomId].gameState.clearBuzz();
            sendUpdate(roomId)
        })

        socket.on("getPlayerData", (callback:(player:Player) => void)=>{
            callback(players[socket.id]);
        })

        socket.on("updateSettings", (roomId:number, settings:Settings)=>{
            const room:Room = rooms[roomId];
            room.settings.shouldLock = settings.shouldLock;
            room.settings.autoClear = settings.autoClear;
        })

    })

    function sendUpdate(roomId:number) {
        io.to(roomId.toString()).emit("update", rooms[roomId].gameState);
    }

}