<script lang="ts">
	import { writable, type Writable } from "svelte/store";
	import type { Settings } from "../../../types";
	import { onMount } from "svelte";

    export let settings:Writable<Settings>

    let timerDuration = writable(10)

    timerDuration.subscribe((value) => {
        $settings.timerDuration = value*1000
    })
    onMount(() => {
        (<any>window).$("body").tooltip({ selector: '[data-toggle=tooltip]' });
    })
</script>

<div class="modal fade" id="settingsModal" tabindex="-1" aria-labelledby="playerModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5">Settings</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <ul class="list-group list-group-fullwidth">
                    <li class="list-group-item" data-toggle="tooltip" data-bs-placement="left" title="Automatically clear buzzers when a positive point value is assigned" >
                        <div class="form-check form-switch" >
                            <input class="form-check-input" type="checkbox" role="switch" bind:checked={$settings.autoClear} id="autoClearSwitch">
                            <label class="form-check-label" for="autoClearSwitch">Auto Clearing</label>
                        </div>        
                    </li>
                    <li class="list-group-item" data-toggle="tooltip" data-bs-placement="left" title="Lock teammates out after a missed question">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch"  bind:checked={$settings.shouldLock} id="teamLockSwitch">
                            <label class="form-check-label" for="teamLockSwitch">Team Locking</label>
                        </div>
                    </li>
                    <li class="list-group-item" data-toggle="tooltip" data-bs-placement="left" title="Bounce the question to the other team if one team gets a bonus question wrong in the toss up with bonus mode">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" bind:checked={$settings.shouldBounce} id="bonusBounce">
                            <label class="form-check-label" for="bonusBounce">Bounce Bonus Questions</label>
                        </div>
                    </li>
                    <li class="list-group-item" data-toggle="tooltip" data-bs-placement="left" title="MODLE">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" bind:checked={$settings.tournamentStyleBounce} id="tournamentStyleBounce">
                            <label class="form-check-label" for="tournamentStyleBounce">Tournament Style Bounce</label>
                        </div>
                    </li>
                    <!-- <li class=list-group-item> -->
                        <div class="input-group" data-toggle="tooltip" data-bs-placement="left" title="Set the duration of the toss up timer">
                            <span class="input-group-text">Timer Duration</span>
                            <input type="text" class="form-control" placeholder="10" aria-label="Timer Duration" bind:value={$timerDuration} aria-describedby="basic-addon1">
                          </div>
                    <!-- </li> -->
                </ul>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-toggle="tooltip" title="Save Settings"  data-bs-dismiss="modal">Save</button>
            </div>
        </div>
    </div>
</div>


<style lang="scss">
    .input-group {
        margin-top: -1px;
        * {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }
    }
</style>