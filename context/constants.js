// @THEBLOCKCHAINCODERS: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
// @NFTMARKETPLACE: 0x0165878A594ca255338adfa4d48449f69242Eb8F
// @TOKENSALE: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
// @COMMUNITY: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
// @TRANSFERFUND: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
// @SUPPORT: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
// @DONATION: 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e

import marketAbi from './NFTMarketplace.json';
import theBlockchainCodersAbi from './TheBlockchainCoders.json';
import tokenSaleAbi from './TokenSale.json';
import communityAbi from './Community.json';
import transferFundAbi from './TransferFunds.json';
import supportAbi from './Support.json';
import donationAbi from './Donation.json';

// THE BLOCKCHAIN CODERS
export const THE_BLOCKCHAIN_CODER_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
export const THE_BLOCKCHAIN_CODERS_ABI = theBlockchainCodersAbi.abi;

// NFT MARKETPLACE 
export const NFT_MARKETPLACE_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
export const NFT_MARKETPLACE_ABI = marketAbi.abi;

// TOKEN SALE
export const TOKEN_SALE_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
export const TOKEN_SALE_ABI = tokenSaleAbi.abi;

// COMMUNITY
export const COMMUNITY_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
export const COMMUNITY_ABI = communityAbi.abi;

// TRANSFER FUND
export const TRANSFER_FUND_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
export const TRANSFER_FUND_ABI = transferFundAbi.abi;

// SUPPORT
export const SUPPORT_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
export const SUPPORT_ABI = supportAbi.abi;

// DONATION
export const DONATION_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
export const DONATION_ABI = donationAbi.abi;
