import { SigningCosmWasmClient, Secp256k1HdWallet, GasPrice, Coin } from "cosmwasm";

import * as fs from 'fs';
import axios from 'axios';
import { ClientRequest } from "http";

const rpcEndpoint = "https://rpc.uni.juno.deuslabs.fi";

const manager_wasm = fs.readFileSync("../artifacts/manager.wasm");
const counter_wasm = fs.readFileSync("../artifacts/counter.wasm");


// const mnemonic =
//     "test peanut elevator motor proud globe obtain gasp sad balance nature ladder"; // Richard: juno10c3slrqx3369mfsr9670au22zvq082jaej8ve4
const mnemonic =
    "core fun avoid mosquito plastic light abandon age focus essay volume normal"; // test1: juno13nu6usqlcvsqn8g806d2prrtk5qdajrmts8s5a
// const mnemonic =
//     "dentist few exact avoid resource find frequent kit idle dinner music repeat";  //test2: juno1ac4ej6vg9najlvg5l7hyufkc83m3hlsvr9gyaw

    
const code_id_manager = 2698;
const code_id_counter = 2699;

const contract_manager_address = "juno1up2v0x7xfqyw6zzzwfetwkxpuy356dgxk5vms6q4daxp7p2ygx7qz94lcn";
const contract_counter_address = "juno1lfewu63ev862fmzkas02laj9hhxnt489pwzjn0adts7tg7m5h30s3f0dg6";

async function setupClient(mnemonic: string, rpc: string, gas: string | undefined): Promise<SigningCosmWasmClient> {
    if (gas === undefined) {        // This option is for Stargaze - no gas
        let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno'});
        let client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet);
        return client;
    } else {
        let gas_price = GasPrice.fromString(gas);
        let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno' });
        let client = await SigningCosmWasmClient.connectWithSigner(rpc, wallet, { gasPrice: gas_price });
        return client;
    }
}

async function getAddress(mnemonic: string, prefix: string = 'juno') {
    let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix });
    let accounts = await wallet.getAccounts();
    return accounts[0].address;
}

// CLI COMMANDS
// tsc -v   #Version 4.9.3
// cd node // -- npm test -- has to be run from the node directory 
// npm install
// npm ls typescript
// npm i -D typescript ts-node
// npm test

describe("Messages Fullstack Test", () => {
    xit("Generate Wallet", async () => {
        let wallet = await Secp256k1HdWallet.generate(12);
        console.log(wallet.mnemonic);
    });

    xit("Get Addresss", async () => {
        console.log(await getAddress(mnemonic));
    });
    
    xit("Get All Acounts", async () => {
        let prefix : string = 'juno';
        // If we do not give the optional prefix parameter, we would get the main cosmos address
        let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic,{ prefix });
        console.log(await wallet.getAccounts());
    });

    xit("Get Testnet Tokens", async () => {
        //let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'juno' });
        //console.log(await wallet.getAccounts());
        console.log(await getAddress(mnemonic));
        try {
            let res = await axios.post("https://faucet.uni.juno.deuslabs.fi/credit", { "denom": "ujunox", "address": await getAddress(mnemonic) });
            console.log(res);
        } catch (e) {
            console.log(e);
        }
    }).timeout(100000);

    xit("Balance Testnet Tokens", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let searchDenom: string = 'ujunox';
        let res = await client.getBalance(await getAddress(mnemonic), "ujunox");
        console.log(res);        
    }).timeout(100000);

    // This test does not work yet. Could be the testnet or not.
    it("Send Testnet Tokens", async () => { 
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let receiver = "juno1ac4ej6vg9najlvg5l7hyufkc83m3hlsvr9gyaw";
        let res = await client.sendTokens(await getAddress(mnemonic), receiver, [{denom:"ujunox", amount:"100000"}], "auto");
        console.log(res);    
    }).timeout(100000);

    

    //same as
    //junod tx wasm store artifacts/messages.wasm --from wallet --node https://rpc.uni.juno.deuslabs.fi --chain_id=uni-3 --gas-price=0.025ujunox --gas auto
    xit("1. Upload code manager_wasm to testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.upload(await getAddress(mnemonic), manager_wasm, "auto");
        console.log("manager_wasm: %s",JSON.stringify(res.logs[0].events));
    }).timeout(100000);

    xit("2. Upload code counter_wasm to testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.upload(await getAddress(mnemonic), counter_wasm, "auto");
        //calculateFee()
        console.log("manager_wasm: %s",JSON.stringify(res.logs[0].events));
    }).timeout(100000);

    // juno1up2v0x7xfqyw6zzzwfetwkxpuy356dgxk5vms6q4daxp7p2ygx7qz94lcn
    xit("3. Instantiate manager contract code on testnet", async () => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.instantiate(await getAddress(mnemonic), code_id_manager, { }, "messages", "auto");
        console.log(res);
    }).timeout(100000);

    // counter contract: juno1lfewu63ev862fmzkas02laj9hhxnt489pwzjn0adts7tg7m5h30s3f0dg6
    xit("4. Instantiate a counter contract from the manager contract - testnet", async() => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.execute(
            await getAddress(mnemonic), contract_manager_address, {instantiate_new_counter : { code_id: code_id_counter }}, "auto", "", []
        ); // ExecuteMsg::InstantiateNewCounter { code_id } 
        console.log(res);

        for (let i = 0; i<res.logs[0].events.length; i++) {
            console.log("------------EVENTS[%s]-----------------",i);
            console.log(res.logs[0].events[i]);          
        }
     }).timeout(20000); 

    xit("5. Query get contracts address created by manager contract", async() => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.queryContractSmart(contract_manager_address, { get_contracts: { } } );      // QueryMsg::GetContracts {}
        // Here we get the contract address for the counter contract. we need it in test 6

        for (let i = 0; i<res['contracts'].length; i++) {
            console.log("------------CONTRACTS[%s]-----------------", i);
            console.log(res['contracts'][i]);
            console.log("___________________________________________");
        }
        //console.log(res['contracts'][0][1]); console.log(res['contracts'][1][1]); console.log(res['contracts'][2][1]);

        console.log(res);
    }).timeout(100000);


    xit("6. Increment the counter (counter contract) from the manager contract - testnet", async() => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.execute(
            await getAddress(mnemonic), contract_manager_address, {increment : { contract: contract_counter_address}}, "auto", "", []
        );  // ExecuteMsg::Increment { contract: String }
        console.log(res);

        // let res = await client.execute(    // ExecuteMsg: SENDING FUNDS
        //     await getAddress(mnemonic), contract_manager_address, {increment : { contract: contract_counter_address}}, "auto", "", [{amount: "1000000", denom: "ujunox"}]
        // );        

        for (let i = 0; i<res.logs[0].events.length; i++) {
            console.log("------------EVENTS[%s]-----------------",i);
            console.log(res.logs[0].events[i]);          
        }

        // for (var val of res.logs[0].events) {
        //     console.log("------------EVENTS-----------------");
        //     console.log(val); 
        //   }
     }).timeout(20000);

     xit("6.1 Increment the counter twice (counter contract) from the manager contract - testnet", async() => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.execute(
            await getAddress(mnemonic), contract_manager_address, {increment : { contract: contract_counter_address}}, "auto", "", []
        );  // ExecuteMsg::Increment { contract: String }
        console.log(res);

        let res2 = await client.execute(
            await getAddress(mnemonic), contract_manager_address, {increment : { contract: contract_counter_address}}, "auto", "", []
        );  // ExecuteMsg::Increment { contract: String }
        console.log(res2);
     }).timeout(20000);


     xit("7. Query GetCount {} from counter contract", async() => {
        let client = await setupClient(mnemonic, rpcEndpoint, "0.025ujunox");
        let res = await client.queryContractSmart(contract_counter_address, { get_count: { } } );      // QueryMsg::GetCount {}
        console.log(res);
    }).timeout(100000);
    
});