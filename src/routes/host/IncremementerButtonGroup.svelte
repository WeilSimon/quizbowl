<script lang="ts">
	import { writable, type Writable } from "svelte/store";

    export let updatePoints: (value:number) => any
    export let enabled:Writable<boolean> = writable(true)
</script>

<div class="btn-group" role="group" aria-label="Basic example">
    <button
        type="button"
        on:click={() => updatePoints(15)}
        class="{$enabled ? '' : 'disabled'} btn btn-success">+15</button
    >
    <button
        type="button"
        on:click={() => updatePoints(10)}
        class="{$enabled ? '' : 'disabled'} btn btn-warning">+10</button
    >
    <button
        type="button"
        on:click={() => updatePoints(0)}
        class="{$enabled ? '' : 'disabled'} btn btn-secondary">0</button
    >
    <button
        type="button"
        on:click={() => updatePoints(-5)}
        class="{$enabled ? '' : 'disabled'} btn btn-danger">-5</button
    >
</div>


<style lang=scss>
    .btn-group {
        width:100%
    }
</style>