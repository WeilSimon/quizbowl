<script lang="ts">
	// import bootstrap from 'bootstrap';

	import ioClient from 'socket.io-client';
	import { onMount } from 'svelte';
	import type { GameStateData, PlayerData, Settings } from '../../../types';
	import BuzzList from '../BuzzList.svelte';
	import PlayerButton from './PlayerButton.svelte';
	import SettingsModal from './SettingsModal.svelte';
	import { writable, type Writable } from 'svelte/store';
	const socket = ioClient("cs.catlin.edu", {
        path:"/node/2023/simon/socket.io",
    });
	let jq: any;
	/**
	 * @type {any}
	 */
	let roomId: number;

	let team1: Writable<PlayerData[]> = writable([]);
	let team2: Writable<PlayerData[]> = writable([]);
	let teamNull: Writable<PlayerData[]> = writable([]);
	let buzzList: PlayerData[] = [];
	let areAnyBlocked: Writable<boolean> = writable(true);

	let gameState: GameStateData | null = null;

	let settings: Writable<Settings> = writable({ shouldLock: false, autoClear: false });

	onMount(() => jq = (<any>window).$);
	let selectedPlayer: PlayerData;

	socket.once('connect', () => {
		socket.emit('hostLogin', (response: { roomId: number; settings: Settings }) => {
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
	});

	function showPopup(player: PlayerData) {
		console.log('Showing popup for', player);
		selectedPlayer = player;
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
		socket.emit('incrementScore', { playerId: buzzList[0].id, score: points });
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
							<PlayerButton team={team1} {index} {showPopup} />
							<li class="list-group-item">
								{#if $teamNull[index] != null}
									<div class="btn-group" role="group" aria-label="Basic example">
										<button
											type="button"
											class="btn btn-primary"
											on:click={() => setPlayerTeam1($teamNull[index])}>←</button
										>
										<button on:click={() => showPopup($teamNull[index])} class=" btn btn-{$teamNull[index].isLocked? 'warning': $teamNull[index].isBuzzed ? 'danger': 'primary'}">
                                            {$teamNull[index].name}
                                        </button>
										<button
											type="button"
											class="btn btn-primary"
											on:click={() => setPlayerTeam2($teamNull[index])}>→</button
										>
									</div>
								{/if}
							</li>
							<PlayerButton team={team2} {index} {showPopup} />
						</ul>
					{/each}
				</div>
			</div>
			<div class="col-3">
				<BuzzList {buzzList} />
			</div>
			<div class="col-3">
				<span id="header" class="d-flex justify-content-between align-items-center">
					<h2>Room {roomId ?? 'Loading'}</h2>
					<button class="btn btn-secondary" on:click={showSettings}><i class="fas fa-cog" /></button
					>
				</span>
				<div class="buttonpanel">
					<button on:click={clearBuzzers} class="{$areAnyBlocked ? '' : 'disabled'} btn btn-primary"
						>Clear Buzzers</button
					>
					<div class="btn-group" role="group" aria-label="Basic example">
						<button
							type="button"
							on:click={() => updatePoints(15)}
							class="{$areAnyBlocked ? '' : 'disabled'} btn btn-success">+15</button
						>
						<button
							type="button"
							on:click={() => updatePoints(10)}
							class="{$areAnyBlocked ? '' : 'disabled'} btn btn-warning">+10</button
						>
						<button
							type="button"
							on:click={() => updatePoints(0)}
							class="{$areAnyBlocked ? '' : 'disabled'} btn btn-secondary">0</button
						>
						<button
							type="button"
							on:click={() => updatePoints(-5)}
							class="{$areAnyBlocked ? '' : 'disabled'} btn btn-danger">-5</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal -->
<div
	class="modal fade"
	id="playerModal"
	tabindex="-1"
	aria-labelledby="playerModalLabel"
	aria-hidden="true"
>
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h1 class="modal-title fs-5" id="playerModalLabel">Manage {selectedPlayer?.name}</h1>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<button
					type="button"
					on:click={() => {
						kick(selectedPlayer);
						closePopup();
					}}
					class="modalbutton btn btn-danger">Kick</button
				>
				<div class="input-group mb-3">
					<input
						id="renameField"
						on:keypress={(event) => {
							if (event.key == 'Enter') {
								rename();
							}
						}}
						type="text"
						class="form-control"
						placeholder="New username"
					/>
					<button on:click={rename} class="btn btn-primary input-group-text">Rename</button>
				</div>
				{#if selectedPlayer?.teamNumber != 0}
					<button
						type="button"
						on:click={() => {
							swapPlayerTeam(selectedPlayer);
							closePopup();
						}}
						class="modalbutton btn btn-primary">Switch Team</button
					>
				{/if}
				<br />
				<ul class="list-group list-group-stacking list-group-horizontal">
					<li class="list-group-item list-group-header">Points</li>
					<li class="list-group-item list-group-header">Buzzed</li>
					<li class="list-group-item list-group-header">Power</li>
					<li class="list-group-item list-group-header">Neg 5</li>
				</ul>
				<ul class="list-group list-group-stacking list-group-horizontal">
					<li class="list-group-item">{selectedPlayer?.points}</li>
					<li class="list-group-item">{selectedPlayer?.timesBuzzed}</li>
					<li class="list-group-item">{selectedPlayer?.power}</li>
					<li class="list-group-item">{selectedPlayer?.negFives}</li>
				</ul>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			</div>
		</div>
	</div>
</div>

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
