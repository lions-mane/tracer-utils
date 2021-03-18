import { DomainDataType, LimitOrderDataType, DomainData, OrderData, SigningData } from './types';
export declare const domain: DomainDataType;
export declare const limitOrder: LimitOrderDataType;
export declare const generateDomainData: (trader_address: string, chainId?: number) => DomainData;
export declare const signOrder: (web3: any, signingAccount: string, data: SigningData) => Promise<[string, string, string]>;
export declare const signOrders: (web3: any, orders: OrderData[], traderAddress: string) => Promise<Promise<{
    order: OrderData;
    sigR: string;
    sigS: string;
    sigV: string;
}>[]>;
declare const _default: {
    signOrders: (web3: any, orders: OrderData[], traderAddress: string) => Promise<Promise<{
        order: OrderData;
        sigR: string;
        sigS: string;
        sigV: string;
    }>[]>;
    signOrder: (web3: any, signingAccount: string, data: SigningData) => Promise<[string, string, string]>;
    generateDomainData: (trader_address: string, chainId?: number | undefined) => DomainData;
    domain: DomainDataType;
    limitOrder: LimitOrderDataType;
};
export default _default;
