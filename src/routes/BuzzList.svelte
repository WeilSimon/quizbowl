<script lang="ts">
	import type { PlayerData } from "../../types";
    export let buzzList:PlayerData[]
    const formatTeamNumber  =(teamNumber:number) => teamNumber == 0 ? 'None' : teamNumber == 1 ? 'Team 1' : 'Team 2'
    const teamBadgeClasses: { [key: number]: string } = {
		1: '#ff00ff',
		2: '#0000ff',
		0: '#999999'
	};
</script>


<ul id="buzzedlist" class="list-group">
    <li class="list-group-item list-group-item-secondary"><b>Buzzed Players</b></li>
    {#each buzzList as player}
        <li class="list-group-item justify-content-between align-items-center">
            {player.name} <span class="badge" style="background-color:{teamBadgeClasses[player.teamNumber]};">{formatTeamNumber(player.teamNumber)}</span>
        </li>
    {/each}
</ul>
