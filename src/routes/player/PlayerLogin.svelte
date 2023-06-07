<script lang="ts">
	import { onMount } from "svelte";
	import type { Writable } from "svelte/store";

    export let login:(cb:() => void) => void;
    export let name:Writable<string>;
    export let roomId:Writable<number>;

    let invalidName:boolean = false
    let invalidRoom:boolean = false
    
    function loginFunc() {
        document.getElementById("roomId")?.classList.remove("is-invalid")
        login(() => {
            document.getElementById("roomId")?.classList.add("is-invalid")
        })
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
    console.log('Query variable %s not found', key);
}

    onMount(() => {
        
        if (getQueryVariable("user")) {
            if (getQueryVariable("roomId")) {
                $name = getQueryVariable("user")!.slice(0,30)
                $roomId = parseInt(getQueryVariable("roomId")!)
                login(() => {
                    document.getElementById("roomId")?.classList.add("is-invalid")
                })
            } else {
                $name = getQueryVariable("user")!.slice(0,30)
            }
        }

	})
    roomId.subscribe((value) => {
        if (value < 0) {
            $roomId = parseInt(value.toString().slice(1))
        }
        if (value > 999999) {
            $roomId=parseInt(value.toString().slice(0,6))
        }
    })
    
</script>


<div class=container>
    <h1>Login</h1>
    <form id="loginform" on:submit|preventDefault={loginFunc}>
        <div class="mb-3">
            <label for="name" class="form-label">User</label>
            <input type="text" class="form-control" maxlength="30" bind:value={$name} name="name" id="name" required>
            
        </div>
        <div class="mb-3">
            <label for="roomId" class="form-label">Room ID</label>
            <input type="number" maxlength="6" class="form-control" bind:value={$roomId} name="roomId" id="roomId" required>
            <div class="invalid-feedback">
                Invalid Room ID
            </div>
        </div>
        <div class="mb-3">
            <input type="submit" class="form-control btn btn-primary" value="Join Room" style="font-size: 20px;">
        </div>
    </form>
</div>