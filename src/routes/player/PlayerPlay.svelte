<svelte:head>
  <title>Quizbowl Play {$roomId}</title>
</svelte:head> 

<script lang="ts">
	import type { Socket } from 'socket.io-client';
	import type { GameStateData, PlayerData } from '../../../types';
	import type { Writable } from 'svelte/store';
  import BuzzList from '../BuzzList.svelte';
	export let socket: Socket;
	export let roomId: Writable<number>;
	export let name: Writable<string>;
	let isBuzzed = false;
	let isLocked = false;
	let teamNumber = 0;
    let latency = 0;

	export let buzzList: PlayerData[];

	socket.on('disconnect', () => {
		console.log('disconnecting :(');
		window.location.href = window.location.href.replace('player', '');
	});

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
		buzzList = Object.values(gamestate.buzzedList ?? {});
		socket.emit('getPlayerData', (player: PlayerData) => {
      latency = player.latency;
			$name = player.name;
			isBuzzed = player.isBuzzed;
			isLocked = player.isLocked;
			teamNumber = player.teamNumber;
		});
	});

	
</script>

<div class="container">
	<div class="row">
		<div class="col-9">
			<button class="roundButton {isBuzzed ? 'buzzed' : isLocked ? 'locked' : ''}" on:click={buzz}>
				{isBuzzed ? 'BUZZED' : isLocked ? 'LOCKED' : 'BUZZ'}
			</button>
		</div>
		<div class="col-3">
			<div class="list-group">
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
			<BuzzList {buzzList}></BuzzList>
		</div>
	</div>
</div>
<center />

<style>
	#buzzlistpadding {
		margin-top:20px;
	}
	.roundButton {
		border-radius: 100%;
		width: 50vmin;
		height: 50vmin;
		background-color: #0d6efd;
		color: #ffffff;
		font-size: 20pt;
	}
	.roundButton:active {
		background-color: #ffffff;
		color: #0d6efd;
	}

	.locked {
		background-color: #ffff00;
		color: #000000;
	}
	.locked:active {
		background-color: #ff9500;
		color: #000000;
	}
	.buzzed {
		background-color: #ff0000;
		color: #ffffff;
	}
	.buzzed:active {
		background-color: #ff6831;
		color: #ffffff;
	}

	.container {
		padding: 40px;
		width: 80vw;
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
