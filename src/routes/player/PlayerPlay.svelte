<svelte:head>
  <title>Quizbowl Play {$roomId}</title>
</svelte:head> 

<script lang="ts">
	import type { Socket } from 'socket.io-client';
	import type { GameStateData, PlayerData } from '../../../types';
	import type { Writable } from 'svelte/store';
  	import BuzzList from '../BuzzList.svelte';
	import { onDestroy, onMount } from 'svelte';
	export let socket: Socket;
	export let roomId: Writable<number>;
	export let name: Writable<string>;
	let isBuzzed = false;
	let isLocked = false;
	let teamNumber = 0;
    let latency = 0;

	
	let buzzSound:any;

	export let buzzList: {[key:string]:PlayerData};

	socket.on('disconnect', (reason) => {
		console.log(reason)
		console.log('disconnecting :(');
		if (reason == "io server disconnect") {
			window.location.href = window.location.href.replace('player', '?error=1');
			// window.location.href = window.location.origin+window.location.pathname + "?user=" + $name + "&roomId=" + $roomId;

		} else {
			window.location.href = window.location.origin+window.location.pathname + "?user=" + $name + "&roomId=" + $roomId;
			// window.location.href = window.location.href.replace('player', '?error=2');
		}
		
	});

	onDestroy(() => {
		socket.disconnect()
	})

	onMount(()=>{
		buzzSound = new Audio("/buzz.mp3");
	})

  socket.on("latency", (value:number) => {
      latency = value;
  })
  socket.on("ping", (cb: () => void) => {
      cb();
  })

  const formatTeamNumber =(teamNumber:number) => teamNumber == 0 ? 'None' : teamNumber == 1 ? 'Team 1' : 'Team 2'
	function buzz() {
		if (!isBuzzed && !isLocked) {
			socket.emit('buzz', Date.now());
			isBuzzed = true;
			console.log('buzz');
		}
	}

	socket.on('update', (gamestate: GameStateData) => {
        console.log("Updating");
		buzzList = gamestate.buzzedList;
		socket.emit('getPlayerData', (player: PlayerData) => {
      latency = player.latency;
			$name = player.name;
			isBuzzed = player.isBuzzed;
			isLocked = player.isLocked;
			teamNumber = player.teamNumber;
		});
	});
	
	socket.on('buzzNoise', ()=>{
		buzzSound.load();
		buzzSound.play();
	})



	
</script>
<svelte:window on:keydown|preventDefault={(event) => {if (event.code == "Space") {buzz()}}}></svelte:window>
<div class="container">
	<div class="row">
		<div class="col-sm">
			<center>
				<button id="roundButton" class="{isBuzzed ? 'buzzed' : isLocked ? 'locked' : ''}" on:click={buzz}>
					{isBuzzed ? 'BUZZED' : isLocked ? 'LOCKED' : 'BUZZ'}
				</button>
			</center>
			<br>
		</div>
		<div class="col-sm">
			<BuzzList {buzzList}></BuzzList>
			<br>
		</div>
		<div class="col-sm">
			<div class="list-group" id=roominfo>
				<div class="list-group-item flex-column align-items-start">
					<div class="d-flex w-100 justify-content-between">
						<h5 class="mb-1">Room ID</h5>
					</div>
					<p class="mb-1">{$roomId}</p>
				</div>
				<div class="list-group-item flex-column align-items-start">
					<div class="d-flex w-100 justify-content-between">
						<h5 class="mb-1">Name</h5>
					</div>
					<p class="mb-1">{$name}</p>
				</div>
        		<div class="list-group-item flex-column align-items-start">
					<div class="d-flex w-100 justify-content-between">
						<h5 class="mb-1">Latency</h5>
					</div>
					<p class="mb-1">{latency} ms</p>
				</div>
				<div class="list-group-item flex-column align-items-start">
					<div class="d-flex w-100 justify-content-between">
						<h5 class="mb-1">Team</h5>
					</div>
					<p class="mb-1">{formatTeamNumber(teamNumber)}</p>
				</div>
			</div>
			<div id=buzzlistpadding></div>
		</div>
	</div>
</div>

<style lang="scss">
	#buzzlistpadding {
		margin-top:20px;
	}
	#roundButton {
		border-radius: 100%;
		width: 50vmin;
		height: 50vmin;
		background-color: #0d6efd;
		color: #ffffff;
		font-size: 20pt;

		&:active {
			background-color: #ffffff;
			color: #0d6efd;
		}
		&.locked {
		background-color: #ffff00;
		color: #000000;
		}
		&.locked:active {
			background-color: #ff9500;
			color: #000000;
		}
		&.buzzed {
			background-color: #ff0000;
			color: #ffffff;
		}
		&.buzzed:active {
			background-color: #ff6831;
			color: #ffffff;
		}
	}
	.container {
		padding: 40px;
		width: 80vw;
	}

	@media (max-width: 576px) { 
		.container {
			padding:0;
			margin:0;
			width:100vw;
		}
		.col-sm {
			padding:0;
		}

		#roominfo * {
			border-radius: 0 !important;
		}

		#roundButton {
			padding:5vmin;
			width: 90vmin;
			height: 90vmin;
		}
	}

	

  .list-group-item {
    overflow-wrap:break-word;
  }

	h1 {
		margin-left: auto;
		margin-right: auto;
		display: block;
	}

	.list-group {
		width: 100%;
	}

	
</style>
