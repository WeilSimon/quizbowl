<script lang="ts">
import ioClient from 'socket.io-client';
import type { GameStateData, PlayerData } from '../../../types';
const socket = ioClient("cs.catlin.edu", {
    path:"/node/2023/simon/socket.io",
});
import {invalidate} from "$app/navigation"
import {page} from "$app/stores"
import PlayerPlay from "./PlayerPlay.svelte"
import PlayerLogin from "./PlayerLogin.svelte"
	import { writable, type Writable } from 'svelte/store';


let inRoom = false;
let isBuzzed = false;
let isLocked = false;
let name = writable('');
let roomId:Writable<number> = writable();

let buzzList:PlayerData[] = []


function login(invalidcb:() => void){
    
    socket.emit("login", {name:$name,roomId:$roomId}, (response:{isConnected: boolean, gamestate:GameStateData}) => {
        inRoom = response.isConnected
        if(inRoom){
		    buzzList = Object.values(response.gamestate.buzzedList ?? {});
        } else {
            invalidcb()
        }
        
        
    })
    return true;
    
}

</script>

<style>
    


</style>

{#if !inRoom}
    <PlayerLogin {login} {name} {roomId}></PlayerLogin>
{:else}
    <PlayerPlay {buzzList} socket={socket} roomId={roomId} name={name}></PlayerPlay>
{/if}


