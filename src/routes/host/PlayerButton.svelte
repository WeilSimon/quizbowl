<script lang="ts">
	import type { Writable } from 'svelte/store';
	import type { PlayerData, TeamData } from '../../../types';

	export let team: Writable<PlayerData[]>;

	export let showPopup: (player: PlayerData) => void;
	export let index: number;
</script>

<li class="list-group-item">
	{#if $team[index] != null}
		<button on:click={() => showPopup($team[index])} class=" btn btn-{$team[index].isLocked? 'warning': $team[index].isBuzzed ? 'danger': 'primary'}">
            {$team[index].name}
        </button>
	{/if}
</li>

<style lang="scss">
	button {
		max-width: 100%;
	}
	.list-group-header {
		font-weight: 600;
	}
	.playerlabel {
		opacity: 100%;
	}
	.list-group-item {
		&:nth-child(2) {
			width: 300px;
		}
		width: 150px;
		text-align: center;
		border-radius: 0px !important;
		margin-bottom: -1px;
	}
</style>
