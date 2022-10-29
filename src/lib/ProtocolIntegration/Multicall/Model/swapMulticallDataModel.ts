
export interface ISwapMulticallDataModel{

    TokenIn?: string;
    TokenOut?: string;
    Fee?: number;
    AmountIn?: string;
    AmountOutMinimum?: string; 
    SqrtPriceLimitX96?: string;
    Slippage?: number;

}