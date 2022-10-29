import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import * as dotenv from "dotenv";
import {TransactionConfig} from "web3-core";
import {TransactionReceipt} from "web3-eth";
import {ISwapMulticallDataModel} from "../Model/swapMulticallDataModel";


//Configuring the directory path to access .env file
dotenv.config();
//Accessing UniswapV3Router contract's ABI
const UniswapV3RouterABI = require('../../../../src/lib/abi/UniswapV3RouterABi.json');
const UniswapV3QuoterABI = require('../../../../src/lib/abi/UniswapV3QuoterABI.json');
const UniswapV3ERC20ABI = require('../../../../src/lib/abi/UniswapERC20ABI.json');
let receiptPromise: Promise<TransactionReceipt>;
/// @notice swapExactInputSingle swaps a fixed amount of Token1 for a maximum possible amount of Token1
/// using the DAI/WETH9 0.3% pool by calling `exactInputSingle` in the swap router.
/// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
/// @param amountIn The exact amount of DAI that will be swapped for WETH9.
/// @return amountOut The amount of WETH9 received.

export const MulticallAsync = async(swapMulticallDataModel:ISwapMulticallDataModel) : Promise<any>=> {

  //Promise<TransactionReceipt>=>

  console.log("Program Started");
  // Setting up Ethereum blockchain Node through Infura
  const web3 = new Web3(process.env.infuraUrlRinkeby!);

  const qWeb3 = new Web3(process.env.infuraUrlMainnet!);

  //Variable for to return
  let encoded_tx: string;
  let transactionObject:TransactionConfig;

  //Providing Private Key
  const activeAccount = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY!);
  console.log("Program Started 2");
  // Initialising the Uniswap Router Contract
  const routerContract = new web3.eth.Contract(UniswapV3RouterABI as AbiItem[], process.env.UniswapV3RinkebyRouterAddress);
  const QuoterContract = new qWeb3.eth.Contract(UniswapV3QuoterABI as AbiItem[], process.env.UniswapV3QuoterAddress);
  //const erc20Contract = new web3.eth.Contract(UniswapV3ERC20ABI as AbiItem[], process.env.UniswapV3RinkebyRouterAddress);
  //const erc20Asset = new web3.eth.Contract(UniswapV3ERC20ABI as AbiItem[], swapMulticallDataModel.TokenIn);
  const erc20Asset = new web3.eth.Contract(UniswapV3ERC20ABI as AbiItem[], '0x577d296678535e4903d59a4c929b718e1d575e0a');
  
  const weth9Address = "0xc778417E063141139Fce010982780140Aa0cD5Ab"; // Rinkeby Weth Address
  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 Mainnet Address

  //Setting up the deadline for the transaction
  const expiryDate = Math.floor(Date.now() / 1000) + 900;
  console.log("Program Started 3");

  //Calculate AmountOutMin
  // Retrived from the mainnet
  //console.log("Parameters: ",swapMulticallDataModel.TokenIn,swapMulticallDataModel.TokenOut,swapMulticallDataModel.Fee ?? 3000,swapMulticallDataModel.AmountIn,'0');
  //0x6b175474e89094c44da98b954eedeac495271d0f 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984 3000 10000 0
 // let amountOutMin = await QuoterContract.methods.quoteExactInputSingle(0x221657776846890989a759BA2973e427DfF5C9bB, 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, 3000, '9600000000000', '0')
 //let amountOutMin = await QuoterContract.methods.quoteExactInputSingle('0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 3000, '10000', '0').call();
 //console.log("Parameters:",swapMulticallDataModel.TokenIn,swapMulticallDataModel.TokenOut,swapMulticallDataModel.Fee ?? 3000,swapMulticallDataModel.AmountIn.split(".")[0],'0');
  let amountOutMin = await QuoterContract.methods.quoteExactInputSingle(swapMulticallDataModel.TokenIn,swapMulticallDataModel.TokenOut,swapMulticallDataModel.Fee ?? 3000,swapMulticallDataModel.AmountIn,'0').call();
  //console.log("Parameters:",swapMulticallDataModel.TokenIn,swapMulticallDataModel.TokenOut,swapMulticallDataModel.Fee ?? 3000,swapMulticallDataModel.AmountIn,'0');
  console.log("AmountOutMin : ",amountOutMin);
  //console.log("Program Started 4");
  //Hardcoded the value amountOutMin as it is derived from Mainnet & for sign transaction we are using Rinkeby
  //Value only work with specific input amount ex. 10000. You will need to vary if you want to test.
  //This problem won't arise once "exactInputSingle" is connected through Mainnet.
  const amountOutMinBN = 0.009600960130251036*1e18;  ///0.001206727627180237*1e18;
                        
                         
  
  console.log("Amount Out Min Big Number : ", amountOutMinBN.toString()) ;

  const params = {
    tokenIn: '0x577d296678535e4903d59a4c929b718e1d575e0a', // Wbtc Rinkeby //USDC Rinkeby 0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b  //'0xc7ad46e0b8a400bb3c915120d284aafba8fc4735' - DAI Rinkeby
    tokenOut: weth9Address, //Uni Rinkeby  0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
    fee: swapMulticallDataModel.Fee ?? 3000,
    recipient: '0x0000000000000000000000000000000000000000',
    deadline: expiryDate,
    amountIn: swapMulticallDataModel.AmountIn,
    amountOutMinimum: amountOutMinBN.toString(),//amountOutMinBN ?? '0', //Slippage
    sqrtPriceLimitX96: swapMulticallDataModel.SqrtPriceLimitX96 ?? '0'
  };

  //console.log(params);
  
  // It will be used as count for Nonce
  const txCount = await web3.eth.getTransactionCount(activeAccount.address);

  //console.log("Transaction Count:",txCount);
  // Setting up required parameters for "exactInputSingle"
  // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
  // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
  // For this example, we will set the pool fee to 0.3%.
  // The call to `exactInputSingle` executes the swap.
  
  const multicallData: string[] = [];
  //console.log("Approval Details: ",process.env.UniswapV3RinkebyRouterAddress);
  const currentAllowance = await erc20Asset.methods.allowance(activeAccount.address, process.env.UniswapV3RinkebyRouterAddress).call();
  if(currentAllowance>0)
  {
    
  console.log("Entering Swap");
  multicallData.push( routerContract.methods.exactInputSingle(params).encodeABI());
  
  if(weth9Address!=swapMulticallDataModel.TokenIn){

   console.log("Entered Unwrap Weth");
   multicallData.push( routerContract.methods.unwrapWETH9(amountOutMinBN.toString(),activeAccount.address).encodeABI());
 }
  encoded_tx = routerContract.methods.multicall(multicallData).encodeABI();
  
 // Creating transaction object to pass it through "signTransaction"
  transactionObject = {
   nonce: txCount,
   gas:  4300000, // gas fee needs updating?
   gasPrice: 4200000000,
   data: encoded_tx,
   from: activeAccount.address,
   to: process.env.UniswapV3RinkebyRouterAddress,
   
 };

 //console.log("Trnsaction Object:", transactionObject);

   //Returning receipt for "signTransaction"
   receiptPromise = new Promise<TransactionReceipt>((resolve,reject)=>{

    try {

      console.log("Entered Receipt Promise:")

        let receiptObj:TransactionReceipt;
        //console.log("Transaction Object : ",transactionObject);
        web3.eth.accounts.signTransaction(transactionObject, activeAccount.privateKey, (error, signedTx) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            web3.eth.sendSignedTransaction(signedTx.rawTransaction!).on('receipt', (receipt) => {
              console.log("Receipt : ",receipt);
              receiptObj=receipt;

                  });
                }
                resolve(receiptObj ?? null);
              });

          } catch (error) {
            reject(error);
            throw(error);
          }

    });

  }else{
   
    console.log("Please Approve before Swap");
  }
   
  return receiptPromise;

}
