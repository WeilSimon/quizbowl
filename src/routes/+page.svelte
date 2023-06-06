<svelte:head>
	<script lang="ts">
		if (!window.location.href.includes("localhost")) {
			if (window.location.href.at(-1) != "/") {
				window.location.href = (window.location.href+"/").replace("http://", "https://")
			}
			if (window.location.protocol == "http:") {
				window.location.href = window.location.href.replace("http://", "https://")
			}
		}
	</script>
</svelte:head>

<script lang="ts">
	import { onMount } from "svelte";

		let errorID = 0;
		onMount(() => {
			errorID = parseInt(new URL(window.location.href).searchParams.get("error") ?? "0")
		})

		const messages:{[key:number]:string} = {
			1: "Kicked from room",
			2: "Server Disconnected"
		}
</script>


<div class="outer">
	{#if errorID > 0}
		<div class="alert alert-danger" role="alert">
			{messages[errorID]}
	  	</div>
	{/if}
	<center>
		<h1>Select a Role</h1>
		<div class="vertcenter">
			<a href="host">
				<button class="btn btn-primary">Host</button>
			</a>
			<br />
			<a href="player">
				<button class="btn btn-primary">Player</button>
			</a>
		</div>
	</center>
</div>

<style>
	.outer {
        padding:20px;
        position: absolute;
        top:0;
        bottom:0;
        left:0;
        right:0;
        margin:0;
        width:100vw; 
	}
	
	h1 {
		margin-bottom: 100px;
	}
	button {
		width: 50vw;
		font-size: 18pt;
		padding: 20px;
		margin-bottom: 30px;
	}
</style>
