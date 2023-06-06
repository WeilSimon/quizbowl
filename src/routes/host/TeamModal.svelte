<script lang="ts">
	import type { Writable } from "svelte/store";
	import type { Settings, TeamData } from "../../../types";

    export let team:Writable<TeamData>
</script>

<div class="modal fade" id="settingsModal" tabindex="-1" aria-labelledby="playerModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5">Team {$team.teamNumber}</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <ul class="list-group list-group-fullwidth">
                    <li class="list-group-item">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" bind:checked={$settings.autoClear} id="autoClearSwitch">
                            <label class="form-check-label" for="autoClearSwitch">Auto Clearing</label>
                        </div>        
                    </li>
                    <li class="list-group-item">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" bind:checked={$settings.shouldLock} id="teamLockSwitch">
                            <label class="form-check-label" for="teamLockSwitch">Team Locking</label>
                        </div>
                    </li>
                </ul>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Save</button>
            </div>
        </div>
    </div>
</div>
