<script lang="ts">
	import type { Settings } from "../../../types";
	import { onMount } from "svelte";
	import type { Socket } from "socket.io-client";
	import type { Writable } from "svelte/store";

    export let data:{leadTeam:1|2,  leadCorrect:number, failureCorrect:number, leadActive:boolean, questionNum:1|2|3};
    export let settings:Writable<Settings>
    export let socket:Socket;
    export let roomId:number

    let jq:any;




    function fail(){
        closeModal(true);
        data.leadActive = !data.leadActive
        if(data.leadActive) data.questionNum += 1
    }
    function success() {
        if (data.leadActive) data.leadCorrect += 1
        else data.failureCorrect += 1;
        
        closeModal(false);
        data.leadActive = true;
        data.questionNum += 1;
    }

    function closeModal(isFail:boolean){
        // console.log((questionNum > 3), (isFail && !$settings.shouldBounce), (!leadActive && !$settings.tournamentStyleBounce))
        console.log(data.questionNum)
        if((data.questionNum >= 3 && (!isFail || isFail && !data.leadActive)) || (isFail && !$settings.shouldBounce) || (!data.leadActive && !$settings.tournamentStyleBounce)){
            socket.emit("incrementTeamScore", {roomId, teamId:data.leadTeam, score:10*data.leadCorrect});
            socket.emit("incrementTeamScore", {roomId, teamId:data.leadTeam==1?2:1, score:10*data.failureCorrect})
            jq('#bonusModal').modal('hide');
        }
    }

    onMount(()=>{
		jq = (<any>window).$
    })

</script>

<div class="modal fade" id="bonusModal" tabindex="-1" aria-labelledby="playerModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5">Team {data.leadActive?data.leadTeam:3-data.leadTeam} Bonus Question {data.questionNum}</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="btn-group" role="group" aria-label="Basic example">
                    <button on:click={success} type="button" class="btn btn-success">Correct</button>
                    <button on:click={fail} type="button" class="btn btn-danger">Incorrect</button>
                </div>
                <div id=points>
                <div class="input-group mb-3">
                    <span class="input-group-text" id="basic-addon1">Team 1</span>
                    <span class="form-control">{data.leadTeam==1?data.leadCorrect*10 : data.failureCorrect*10} points</span>
                    </div>
                <div class="input-group mb-3">
                    <span class="input-group-text" id="basic-addon1">Team 2</span>
                    <span class="form-control">{data.leadTeam==2?data.leadCorrect*10 : data.failureCorrect*10} points</span>
                </div>
                </div>
            </div>
        </div>
    </div>
</div>



<style lang=scss>
    #points {
        margin-top:10px;
        .input-group {
            margin-top:-1px;
            margin-bottom:0px !important;
            &:first-child > * {
                border-bottom-right-radius: 0;
                border-bottom-left-radius: 0;
            }
            &:last-child > * {
                border-top-left-radius: 0; 
                border-top-right-radius: 0;
            }
            &:not(:first-child):not(:last-child) > * {
                    border-top-left-radius: 0; 
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                    border-bottom-left-radius: 0;
            }
            .input-group-text {
                width:80px;
            }
        }
    }
    .btn-group {
        width:100%;
        button {
            width:50%
        }
    }
</style>