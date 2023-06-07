<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    let timerDuration:number = 60;
    let timerEndSound:any;
    
    
    
    let timerCounting:boolean = false;
    let startTime = Date.now();
    let timeRemaining = 0;
    
    let interval = setInterval(()=>{
        if(timerCounting ){
            timeRemaining = (timerDuration-((Date.now() - startTime)/1000));
            if(timeRemaining <= 0){
                timeRemaining = 0;
                timerCounting = false;
                timerEndSound.play();
            }
            date.setSeconds(timeRemaining)
            date = date;
        }
        else{
            timeRemaining = timerDuration;
        }
    },10)

    function timerClick(){
        timerCounting = !timerCounting
        if(timerCounting) startTime = Date.now();
    }
    
    onMount(()=>{
        timerEndSound = new Audio("/timerEnd.mp3");
    })

    onDestroy(() => {
        clearInterval(interval)
    })


    var date = new Date(0);

</script>

<center>
    <h1>{(Math.floor((timeRemaining)/60)).toString()}:{(Math.floor(timeRemaining)%60).toFixed(0).padStart(2,"0")}</h1>
    <div class="input-group">
        <span class="input-group-text">Timer Duration (s)</span>
        <input type="number" class="form-control" placeholder="60" min="0" bind:value={timerDuration}>
      </div>
      {#if !timerCounting}
        <button class="btn btn-primary" type="button" id="button-addon1" on:click={timerClick}>Start</button>
      {:else} 
        <button class="btn btn-danger" type="button" id="button-addon1" on:click={timerClick}>Cancel</button>
      {/if}
</center>

<style>
    center {
        margin-top:20px;
    }
    .btn {
        width:100%;
        margin-top:5px;
    }
    center  > h1 {
         font-size: 6rem;
         font-family:monospace;
    }
</style>