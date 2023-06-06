<script lang="ts">
	import type { PlayerData } from "../../../types";
	import IncremementerButtonGroup from "./IncremementerButtonGroup.svelte";

    export let selectedPlayer:PlayerData;
    export let kick:(player:PlayerData) => void;
    export let swapPlayerTeam:(player:PlayerData) => void;
    export let closePopup:() => void;
    export let rename:() => void;
	export let updatePoints: (points: number, player:PlayerData, override:boolean) => void

	let refresh=1;
</script>

<div class="modal fade" id="playerModal" tabindex="-1" aria-labelledby="playerModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h1 class="modal-title fs-5" id="playerModalLabel">Manage {selectedPlayer?.name}</h1>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" />
			</div>
			<div class="modal-body">
				<button type="button" on:click={() => { kick(selectedPlayer); closePopup();}} class="modalbutton btn btn-danger">Kick</button>
				<div class="input-group mb-3 modalbutton">
					<input id="renameField" on:keypress={(event) => {if (event.key == 'Enter') {rename();}}} type="text" class="form-control" placeholder="New username" maxlength="30"/>
					<button on:click={rename} class="btn btn-primary input-group-text">Rename</button>
				</div>
				{#if selectedPlayer?.teamNumber != 0}
					<button type="button" on:click={() => {swapPlayerTeam(selectedPlayer); closePopup();}} class="modalbutton btn btn-primary">Switch Team</button>
				{/if}
				<br />
				<ul class="list-group list-group-stacking list-group-horizontal">
					<li class="list-group-item list-group-header">Points</li>
					<li class="list-group-item list-group-header">Buzzed</li>
					<li class="list-group-item list-group-header">Power</li>
					<li class="list-group-item list-group-header">Neg 5</li>
				</ul>
				{#if refresh > 0} 
				<ul class="list-group list-group-stacking list-group-horizontal">
					<li class="list-group-item">{selectedPlayer?.points}</li>
					<li class="list-group-item">{selectedPlayer?.timesBuzzed}</li>
					<li class="list-group-item">{selectedPlayer?.power}</li>
					<li class="list-group-item">{selectedPlayer?.negFives}</li>
				</ul>
				{/if}
				<IncremementerButtonGroup updatePoints={(points) => {updatePoints(points, selectedPlayer, true)}}/>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			</div>
		</div>
	</div>
</div>


<style lang="scss">
    
	.modalbutton {
		width: 100%;
		margin-top: 5px;
        margin-bottom: 5px;
	}
	.list-group-item {
		width: 150px;
		text-align: center;
	}
	.list-group-stacking .list-group-item {
		border-radius: 0px !important;
		margin-bottom: -1px;
	}
	.list-group-header {
		font-weight: 600;
	}

</style>