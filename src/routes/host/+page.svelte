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
	import BigTimer from './BigTimer.svelte';
	import BonusModal from './BonusModal.svelte';
	const socket = ioClient("cs.catlin.edu", {
        path:"/node/quizbowl/socket.io",
    });
	let jq: any;
	let roomId: number;


	let team1: Writable<PlayerData[]> = writable([]);
	let team2: Writable<PlayerData[]> = writable([]);
	let teamNull: Writable<PlayerData[]> = writable([]);
	let buzzList: PlayerData[] = [];
	let enableButtons: Writable<boolean> = writable(false);

	let bonusRoundData:{leadTeam:1|2,  leadCorrect:number, failureCorrect:number, leadActive:boolean, questionNum:1|2|3} = {
		leadTeam: 1,
		leadCorrect: 0,
		failureCorrect: 0,
		leadActive: true,
		questionNum: 1,
	}

	function resetBonus(){
        bonusRoundData.leadActive = true;
        bonusRoundData.questionNum = 1;
        bonusRoundData.leadCorrect = 0;
        bonusRoundData.failureCorrect = 0;
    }

	let worksheetRoundData = {
		team1count: 0,
		team2count: 0,
		pointsPerQuestion:10
	}

	let lightningRoundData = {
		team1round1: 0,
		team1round2: 0,
		team2round1: 0,
		team2round2: 0,
		pointsPerQuestion:10
	}

	
	let gameState: GameStateData | null = null;

	let settings: Writable<Settings> = writable({ shouldBounce:true, shouldLock: false, autoClear: false, timerDuration:10000, tournamentStyleBounce:false });

	let buzzSound:any;
	
	enum GameMode{
		TOSS_UP,
		LIGHTNING,
		WORKSHEET,
		TOSS_UP_BONUS
	}
	
	let currentMode:GameMode = GameMode.TOSS_UP_BONUS;

	let gameModeMessages:{[K in GameMode]:string} = {
		[GameMode.TOSS_UP]: "Toss Up",
		[GameMode.LIGHTNING]: "Lightning",
		[GameMode.WORKSHEET]: "Worksheet",
		[GameMode.TOSS_UP_BONUS]: "Toss Up With Bonus",		
	}

	let gameModeBuzzers:{[K in GameMode]:boolean} = {
		[GameMode.TOSS_UP]: true,
		[GameMode.LIGHTNING]: false,
		[GameMode.WORKSHEET]: false,
		[GameMode.TOSS_UP_BONUS]: true,		
	}
	

	function setGamemode(newMode:GameMode) {

		currentMode = newMode;
		socket.emit("setBuzzerLock", roomId, !gameModeBuzzers[newMode])
	}

	enum TimerState {
		NOT_STARTED,
		IN_PROGRESS,
		PAUSED,
		FINISHED
	}

	const modes = Object.values(GameMode).filter((value:any) => !isNaN(value)) as GameMode[]
	
	let timerMessages:{[K in TimerState]:string} = {
		[TimerState.NOT_STARTED]: "Timer",
		[TimerState.IN_PROGRESS]: "",
		[TimerState.PAUSED]:      "",
		[TimerState.FINISHED]:    "Out of Time",		
	}
	let timerState:TimerState = TimerState.NOT_STARTED;
	let startTime = Date.now();
	let timeRemaining = 0;
	
	let interval = setInterval(()=>{
		if(timerState == TimerState.IN_PROGRESS){
			timeRemaining = ($settings.timerDuration-(Date.now() - startTime));
			if(timeRemaining <= 0){
				timeRemaining = 0;
				timerState = TimerState.FINISHED;
			}
		}
	},10)


	function timerClick(){
		if (timerState == TimerState.IN_PROGRESS) {
			timerState = TimerState.PAUSED;
		} else if (timerState == TimerState.PAUSED) {
			timerState = TimerState.IN_PROGRESS;
			startTime = Date.now() - ($settings.timerDuration-timeRemaining);
		} else {
			timerState = TimerState.IN_PROGRESS; 
			startTime = Date.now();
		}
	}

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
		clearInterval(interval)
		})
	
	

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
		$enableButtons = buzzList.length > 0;
		console.log("enabled", $enableButtons)
		if (selectedPlayer != null) {
			selectedPlayer = gameState?.team1.playerList[selectedPlayer.id] ?? gameState?.team2.playerList[selectedPlayer.id] ?? gameState?.teamNull[selectedPlayer.id]
		}
	});

	socket.on('buzzNoise', ()=>{
		buzzSound.load();
		buzzSound.play();
	})



	function showPlayerPopup(team:0|1|2, player: PlayerData) {
		console.log('Showing popup for', player);
		selectedPlayer = player;
		selectedPlayerTeam = team;
		jq('#playerModal').modal('show');
	}

	function clearBuzzers() {
		timerState = TimerState.NOT_STARTED;
		console.log('clearing buzzers');
		socket.emit('clearBuzz', roomId);
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
		timerState = TimerState.NOT_STARTED;
		if(currentMode == GameMode.TOSS_UP_BONUS && buzzList[0].teamNumber != 0 && points > 0){
			bonusRoundData.leadTeam = buzzList[0].teamNumber;
			resetBonus();
			jq('#bonusModal').modal('show');
		}
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

	function showBonusModal() {
		jq('#bonusModal').modal('show');
	}

	function applyWorksheetRound() {
		socket.emit("incrementTeamScore", {roomId, teamId: 1, score:worksheetRoundData.team1count*worksheetRoundData.pointsPerQuestion})
		socket.emit("incrementTeamScore", {roomId, teamId: 2, score:worksheetRoundData.team2count*worksheetRoundData.pointsPerQuestion})
		worksheetRoundData.team1count = 0
		worksheetRoundData.team2count = 0
	}

	function applyLightningRound() {
		socket.emit("incrementTeamScore", {roomId, teamId: 1, score:(lightningRoundData.team1round1+lightningRoundData.team1round2)*lightningRoundData.pointsPerQuestion})
		socket.emit("incrementTeamScore", {roomId, teamId: 2, score:(lightningRoundData.team2round1+lightningRoundData.team2round2)*lightningRoundData.pointsPerQuestion})
		lightningRoundData.team1round1 = 0;
		lightningRoundData.team1round2 = 0;
		lightningRoundData.team2round1 = 0;
		lightningRoundData.team2round2 = 0;
		
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
							<PlayerButton team={team1} {index} showPopup={(p) => showPlayerPopup(1, p)} />
							<li class="list-group-item">
								{#if $teamNull[index] != null}
									<div class="btn-group" role="group" aria-label="Basic example">
										<button
											type="button"
											class="btn btn-primary"
											on:click={() => setPlayerTeam1($teamNull[index])}><i class="fas fa-arrow-left" /></button
										>
										<button on:click={() => showPlayerPopup(0, $teamNull[index])} class=" btn btn-{$teamNull[index].isLocked? 'warning': $teamNull[index].isBuzzed ? 'danger': 'primary'}">
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
							<PlayerButton team={team2} {index} showPopup={(p) => showPlayerPopup(2, p)} />
						</ul>
					{/each}
				</div>
			</div>
			<div class="col-3">
				{#if gameModeBuzzers[currentMode]}
				<BuzzList buzzList={gameState?.buzzedList ?? {}} />
				{/if}
				{#if currentMode == GameMode.WORKSHEET}
					<center>
						<h3>Correct Answers</h3>
						<small>Number of correct answers per team</small>
					</center>
					<div id="worksheetRoundForm">
						<div class="input-group mb-3">
							<span class="input-group-text" id="basic-addon1">Team 1</span>
							<input type="number" class="form-control" bind:value={worksheetRoundData.team1count} min=0 placeholder="0" aria-label="Points">
						</div>
						<div class="input-group mb-3">
							<span class="input-group-text" id="basic-addon1">Team 2</span>
							<input type="number" class="form-control" bind:value={worksheetRoundData.team2count} min=0 placeholder="0" aria-label="Points">
						</div>
						<button type="submit" on:click={applyWorksheetRound} class="btn btn-primary">Apply</button>
					</div>
				{:else if currentMode == GameMode.LIGHTNING}
				<div id=lightningRoundForm>
					<center>
						<h3>Lightning Scoring</h3>
						<small>Number of correct answers per team</small>
					</center>
				  <table class="table">
					<thead>
					  <tr>
						<th scope="col">Team</th>
						<th scope="col">Round 1</th>
						<th scope="col">Round 2</th>
					  </tr>
					</thead>
					<tbody>
					  <tr>
						<th scope="row">Team 1</th>
						<td><input type="number" class="form-control" bind:value={lightningRoundData.team1round1} min=0 placeholder="0" aria-label="Points"></td>
						<td><input type="number" class="form-control" bind:value={lightningRoundData.team1round2} min=0 placeholder="0" aria-label="Points"></td>
					  </tr>
					  <tr>
						<th scope="row">Team 2</th>
						<td><input type="number" class="form-control" bind:value={lightningRoundData.team2round1} min=0 placeholder="0" aria-label="Points"></td>
						<td><input type="number" class="form-control" bind:value={lightningRoundData.team2round2} min=0 placeholder="0" aria-label="Points"></td>
					  </tr>
					  
					</tbody>
				  </table>
				  <button type="submit" on:click={applyLightningRound} class="btn btn-primary">Apply</button>
				</div>
				{/if}
				
				
			</div>
			<div class="col-3">
				<span id="header" class="">
					<h2>Room {roomId ?? 'Loading'}</h2>
					<button class="btn btn-secondary" on:click={showSettings}><i class="fas fa-cog" /></button>
					
					<div class="dropdown">
						<button id=gamemodebuttonlabel class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
						  {gameModeMessages[currentMode]}
						</button>
						<ul class="dropdown-menu">
							{#each modes as mode}
								{#if mode != currentMode}
									<li><button on:click={() => setGamemode(mode)} class="dropdown-item">{gameModeMessages[mode]}</button></li>
								{/if}
							{/each}
						</ul>
					</div>
					
				</span>
				<div class="buttonpanel">
					{#if gameModeBuzzers[currentMode]}
					<div class="progress" role="progressbar" aria-label="Basic example" style="height: 40px;" on:click={timerClick}>
						<div class="progress-bar overflow-visible" style="width: {(timerState != TimerState.IN_PROGRESS && timerState != TimerState.PAUSED)?100:timeRemaining/($settings.timerDuration / 100)}%">{timerMessages[timerState]}</div>
					</div>
					<button on:click={clearBuzzers} class="btn btn-primary">Clear Buzzers</button>
					<IncremementerButtonGroup enabled={enableButtons} {updatePoints}/>
					{/if}
					{#if currentMode == GameMode.WORKSHEET}
					<center><h3>Worksheet Settings</h3></center>
					<div class="input-group mb-3">
						<span class="input-group-text" id="basic-addon1">Points per Question</span>
						<input type="number" class="form-control" bind:value={worksheetRoundData.pointsPerQuestion} min=0 placeholder="10" aria-label="Points">
					</div>
					<BigTimer/>
					{:else if currentMode == GameMode.LIGHTNING}
					<center><h3>Lightning Settings</h3></center>
					<div class="input-group mb-3">
						<span class="input-group-text" id="basic-addon1">Points per Question</span>
						<input type="number" class="form-control" bind:value={lightningRoundData.pointsPerQuestion} min=0 placeholder="10" aria-label="Points">
					</div>
					<BigTimer/>
					{/if}

					
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal -->
<PlayerModal {kick} {closePopup} {rename} {swapPlayerTeam} {selectedPlayer} updatePoints={updatePointsFull} ></PlayerModal>

<SettingsModal {settings} />
<BonusModal data={bonusRoundData} {settings} {socket} {roomId}/>
<style lang="scss">
	.table {
		text-align: center;
		input {
			width:70px !important;
		}
	}
	#lightningRoundForm {
		.table {
			margin-bottom: 10px;
		}
		button {
			width:100%;
		}
	}
#worksheetRoundForm {
	.input-group {
		&:first-child {
			margin-top:10px;
		}
		margin-bottom:5px !important;
	}
	button {
		width:100%;
	}
}
.progress-bar { 
  color: #fff;
  cursor: pointer;
  user-select: none;
  font-size:1rem;
	transition:none;
  background-color:#007bff;
  border-color:#007bff;
  &:hover {
    color: #fff;
    background-color: #0069d9;
    border-color: #0062cc;
  }
  }

  h2 {
		margin-bottom:0;
		padding:0;
	}
  
	.dropdown, .dropdown-toggle {
	
	width:100%;
  }
	.list-group-fullwidth {
		.list-group-item {
			width: 100%;
		}
	}
	#header {
		margin-bottom: 30px;
		display:flex;
		flex-flow: row wrap;
		justify-content: space-between;
		row-gap:0.5rem;
	}
	.buttonpanel {
		& > * {
			width: 100%;
			margin-bottom: 5px;
		}
		dropdown {
			& > * {
				width:100%
			}
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
