<script lang="ts">
	// import bootstrap from 'bootstrap';

	import ioClient from 'socket.io-client';
	import { onDestroy, onMount, beforeUpdate } from 'svelte';
	import type { GameStateData, PlayerData, Settings } from '../../../types';
	import BuzzList from '../BuzzList.svelte';
	import PlayerButton from './PlayerButton.svelte';
	import SettingsModal from './SettingsModal.svelte';
	import PlayerModal from './PlayerModal.svelte';
	import IncremementerButtonGroup from './IncremementerButtonGroup.svelte';
	import { writable, type Writable } from 'svelte/store';
	const socket = ioClient("cs.catlin.edu", {
        path:"/node/quizbowl/socket.io",
    });
	let jq: any;
	let roomId: number;

	let team1: Writable<PlayerData[]> = writable([]);
	let team2: Writable<PlayerData[]> = writable([]);
	let teamNull: Writable<PlayerData[]> = writable([]);
	let buzzList: PlayerData[] = [];
	let areAnyBlocked: Writable<boolean> = writable(true);

	let gameState: GameStateData | null = null;

	let settings: Writable<Settings> = writable({ shouldLock: false, autoClear: false });

	let buzzSound:any;

	let timerStart = false;
	let startTime = Date.now();
	let timeRemaining = 0;

	function getQueryVariable(key:string) {
		var query = window.location.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (decodeURIComponent(pair[0]) == key) {
				return decodeURIComponent(pair[1]);
			}
		}
	}

	onMount(() => {
		jq = (<any>window).$
		roomId = parseInt(getQueryVariable("roomId") ?? "")
		buzzSound = new Audio("/buzz.mp3");
	});

	onDestroy(() => {
		socket.emit("hostDisconnect", roomId);
		socket.disconnect();
		})
	
	setInterval(()=>{
		timeRemaining = (10000-(Date.now() - startTime))/100;
		if(timeRemaining < 0) timeRemaining = 0;
	},50)


	let selectedPlayer: PlayerData;
	let selectedPlayerTeam:0|1|2

	socket.once('connect', () => {
		console.log(roomId)
		socket.emit('hostLogin', {roomId:roomId}, (response: { roomId: number; settings: Settings }) => {
			roomId = response.roomId;
			$settings = response.settings;

			settings.subscribe((value) => {
				socket.emit('updateSettings', roomId, $settings);
			});
		});
	});

	

	socket.on('update', (gameData: GameStateData) => {
		gameState = gameData;
		$team1 = Object.values(gameData.team1.playerList);
		$team2 = Object.values(gameData.team2.playerList);
		$teamNull = Object.values(gameData.teamNull);
		buzzList = Object.values(gameData.buzzedList);
		$areAnyBlocked = checkAnyBlocked();
		selectedPlayer = gameState?.team1.playerList[selectedPlayer.id] ?? gameState?.team2.playerList[selectedPlayer.id] ?? gameState?.teamNull[selectedPlayer.id]
	});

	socket.on('buzzNoise', ()=>{
		buzzSound.load();
		buzzSound.play();
	})



	function showPopup(team:0|1|2, player: PlayerData) {
		console.log('Showing popup for', player);
		selectedPlayer = player;
		selectedPlayerTeam = team;
		jq('#playerModal').modal('show');
	}

	function clearBuzzers() {
		console.log('clearing buzzers');
		socket.emit('clearBuzz', roomId);
	}

	function checkAnyBlocked(): boolean {
		$team1.forEach((player) => {
			if (player.isBuzzed || player.isLocked) {
				return true;
			}
		});
		$team2.forEach((player) => {
			if (player.isBuzzed || player.isLocked) {
				return true;
			}
		});
		$teamNull.forEach((player) => {
			if (player.isBuzzed || player.isLocked) {
				return true;
			}
		});
		return true;
	}

	function rename() {
		const name = jq('#renameField').val();
		selectedPlayer.name = name;
		team1 = team1;
		team2 = team2;
		teamNull = teamNull;
		jq('#renameField').val('');
		socket.emit('renamePlayer', selectedPlayer.id, name);
	}

	function updatePoints(points: number) {
		updatePointsFull(points, buzzList[0], false)
	}

	function updatePointsFull(points: number, player:PlayerData, override:boolean) {
		socket.emit('incrementScore', { playerId: player.id, score: points, isOverride:override });
	}

	function closePopup() {
		jq('#playerModal').modal('hide');
	}

	function kick(player: PlayerData) {
		socket.emit('kickPlayer', player.id);
	}
	function swapPlayerTeam(player: PlayerData) {
		if (player.teamNumber == 1) {
			setPlayerTeam2(player);
		} else {
			setPlayerTeam1(player);
		}
	}

	function removeItemOnce<Type>(arr: Type[], value: Type): Type[] {
		var index = arr.indexOf(value);
		if (index > -1) {
			arr.splice(index, 1);
		}
		return arr;
	}

	function setPlayerTeam1(player: PlayerData) {
		player.teamNumber = 1;

		socket.emit('movePlayer', { playerId: player.id, teamNumber: 1 });
		$team1 = [...$team1, player];
		$teamNull = removeItemOnce($teamNull, player);
		$team2 = removeItemOnce($team2, player);
	}

	function setPlayerTeam2(player: PlayerData) {
		player.teamNumber = 2;

		socket.emit('movePlayer', { playerId: player.id, teamNumber: 2 });
		$team2 = [...$team2, player];
		$teamNull = removeItemOnce($teamNull, player);
		$team1 = removeItemOnce($team1, player);
	}

	function showSettings() {
		jq('#settingsModal').modal('show');
	}
</script>

<svelte:head>
	<title>Quizbowl Host {roomId ?? 'Loading'}</title>
</svelte:head>

<div class="container">
	<div class="container">
		<div class="row">
			<div class="col-6">
				<div id="playerlist">
					<ul class="list-group list-group-stacking list-group-horizontal">
						<li class="list-group-item list-group-header">
							Team 1 <span class="badge" style="background-color:#f0f;"
								>{gameState?.team1.points ?? 0}</span
							>
						</li>
						<li class="list-group-item list-group-header">Unassigned</li>
						<li class="list-group-item list-group-header">
							Team 2 <span class="badge" style="background-color:#00f;"
								>{gameState?.team2.points ?? 0}</span
							>
						</li>
					</ul>
					{#each Array(Math.max($team1.length, $team2.length, $teamNull.length)) as _, index (index)}
						<ul id="playerList" class="list-group list-group-stacking list-group-horizontal">
							<PlayerButton team={team1} {index} showPopup={(p) => showPopup(1, p)} />
							<li class="list-group-item">
								{#if $teamNull[index] != null}
									<div class="btn-group" role="group" aria-label="Basic example">
										<button
											type="button"
											class="btn btn-primary"
											on:click={() => setPlayerTeam1($teamNull[index])}><i class="fas fa-arrow-left" /></button
										>
										<button on:click={() => showPopup(0, $teamNull[index])} class=" btn btn-{$teamNull[index].isLocked? 'warning': $teamNull[index].isBuzzed ? 'danger': 'primary'}">
                                            {$teamNull[index].name}
                                        </button>
										<button
											type="button"
											class="btn btn-primary"
											on:click={() => setPlayerTeam2($teamNull[index])}><i class="fas fa-arrow-right" /></button
										>
									</div>
								{/if}
							</li>
							<PlayerButton team={team2} {index} showPopup={(p) => showPopup(2, p)} />
						</ul>
					{/each}
				</div>
			</div>
			<div class="col-3">
				<BuzzList buzzList={gameState?.buzzedList ?? {}} />
			</div>
			<div class="col-3">
				<span id="header" class="d-flex justify-content-between align-items-center">
					<h2>Room {roomId ?? 'Loading'}</h2>
					<button class="btn btn-secondary" on:click={showSettings}><i class="fas fa-cog" /></button
					>
				</span>
				<div class="buttonpanel">
					<div class="progress" role="progressbar" aria-label="Basic example" style="height: 40px;" on:click={()=>{timerStart = true; startTime = Date.now()}}>
						<div class="progress-bar overflow-visible" style="width: {!timerStart?100:timeRemaining}%;transition:none">{!timerStart?'Timer':''}</div>
					</div>
					<button on:click={clearBuzzers} class="{$areAnyBlocked ? '' : 'disabled'} btn btn-primary">Clear Buzzers</button>
					<IncremementerButtonGroup {updatePoints}/>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal -->
<PlayerModal {kick} {closePopup} {rename} {swapPlayerTeam} {selectedPlayer} updatePoints={updatePointsFull} ></PlayerModal>

<SettingsModal {settings} />

<style lang="scss">
	.list-group-fullwidth {
		.list-group-item {
			width: 100%;
		}
	}
	#header {
		margin-bottom: 30px;
	}
	.buttonpanel {
		& > * {
			width: 100%;
			margin-bottom: 5px;
		}
		margin-bottom: 10px;
	}
	.modalbutton {
		width: 100%;
		margin: 5px;
	}
	.list-group-item {
		width: 150px;
		text-align: center;
		button {
			max-width: 100%;
		}
	}

	.list-group-stacking .list-group-item {
		border-radius: 0px !important;
		margin-bottom: -1px;
	}

	#playerlist {
		width: 100%;

		.list-group-item:nth-child(2) {
			width: 300px;
			button:nth-child(2) {
				max-width: 150px;
			}
		}
	}
	.list-group-header {
		font-weight: 600;
	}
	.playerlabel {
		opacity: 100%;
	}

	.container {
		margin-top: 20px;
	}
</style>
