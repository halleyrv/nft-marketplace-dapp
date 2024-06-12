import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from "axios";
import { useRouter } from 'next/router';

// INTERNAL IMPORT
import { converTime } from "../utils/time";
import {
  NFT_MARKETPLACE_ABI,
  NFT_MARKETPLACE_ADDRESS,
  THE_BLOCKCHAIN_CODER_ABI,
  THE_BLOCKCHAIN_CODER_ADDRESS,
  TOKEN_SALE_ABI,
  TOKEN_SALE_ADDRESS,
  COMMUNITY_ABI,
  COMMUNITY_ADDRESS,
  TRANSFER_FUND_ABI,
  TRANSFER_FUND_ADDRESS,
  SUPPORT_ABI,
  SUPPORT_ADDRESS,
  DONATION_ABI,
  DONATION_ADDRESS,
} from "./constants";

import { CALLING_CONTRACT } from "../utils/contract";
import community from '../pages/community';

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const NFT_MARKETPLACE = "CryptoKing CK";

  // GLOBAL STATE VARIABLE
  const router = useRouter();
  const nftCurrency = "ETH";
  const [notify, setNotify] = useState();
  const [currentAccount, setCurrentAccount] = useState("");
  const [accountBalance, setAccountBalance] = useState();

  // NFT CONTRACT
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const [auctionNFTInfo, setAuctionNFTInfo] = useState();
  const [nftBids, setNftBids] = useState([]);
  const [nftContractBalance, setNftContractBalance] = useState();
  const [nftListingFees, setNftListingFees] = useState();

  //CHECK WALLET CONNECTION
  const checkIfWalletConnected = async () => {
    try {
      if (!window.ethereum) {
        console.log("Install Metamask");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        console.log("Connected account:", accounts[0]);

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const getBalance = await provider.getBalance(accounts[0]);
        const convertBal = ethers.utils.formatEther(getBalance);
        setAccountBalance(convertBal);
        console.log("Account balance:", convertBal);
      } else {
        console.log("No accounts found, trying to request access...");
        await connectWallet(); // Try to connect the wallet
      }
    } catch (error) {
      console.error("NO CONNECTION", error);
    }
  };

  // CONNECT WALLET
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        console.log("Install Metamask");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        console.log("Wallet connected:", accounts[0]);
        window.location.reload();
      } else {
        console.log("No accounts found after request.");
      }
    } catch (error) {
      console.error("CONNECT WALLET ERROR", error);
    }
  };

  const fetchNFTs = async () => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI,
      );
      console.log(NFT_MARKETPLACE_CONTRACT);
      // FETCH CONTRACT BALANCE

      const nftConBal = await NFT_MARKETPLACE_CONTRACT.getContractBalance();
      setNftConBalance(
        ethers.utils.formatUnits(nftConBal.toString(), "ether")
      );

      // LISTING FEES
      const listingFee = await NFT_MARKETPLACE_CONTRACT.getListingPrice();
      setNftListingFees(
        ethers.utils.formatUnits(listingFee.toString(),"ether");
      );

      const data = await NFT_MARKETPLACE_CONTRACT.fechMarketItems();

      const items = await Promise.all(data.map(async({
        tokenId,
        auction,
        seller,
        owner,
        price: unformattedPrice,
        sold,
        startAt,
        endAt,
        netPrice,
        tokenPrice

      }) => {
        const tokenURI = await NFT_MARKETPLACE_CONTRACT.tokenURI(tokenId);
        const {
          data: { image, name, description, category},
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), "ether");

        return {
          price,
          tokenId: tokenId.toNumber(),
          id: tokenId.toNumber(),
          seller,
          auction,
          owner,
          image,
          name,
          description,
          tokenURI,
          category,
          sold,
          startAt: new Date(startAt * 1000).toDateString(),
          endAt: new Date(startAt * 1000).toDateString(),
          netPrice: ethers.utils.formatUnits(netPrice.toString(), "ether"),
          endTimestamp: endAt.toNumber(),
          tokenPrice: ethers.utils.formatUnits(tokenPrice.toString(), "ether"),

        }
      }
    ));

    return items;
      
    }catch (error){
      console.log(error);
    }
  }

  useEffect(() => {
    console.log("Checking if wallet is connected...");
    checkIfWalletConnected();
    fetchNFTs();
  }, []);

  // FETCH LISTED AND CREATED NFT
  const fetchMyNFTsOrCreated = async (type) => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI,
      );
      console.log(NFT_MARKETPLACE_CONTRACT);

      const data =
       type === "fetchItemsListed" 
        ? await NFT_MARKETPLACE_CONTRACT.fetchItems.fetchItemsListed() 
        : await NFT_MARKETPLACE_CONTRACT.fetchMyNFTs();

      const items = await Promise.all(data.map(async({
        tokenId,
        auction,
        seller,
        owner,
        price: unformattedPrice,
        sold,
        startAt,
        endAt,
        netPrice,
        tokenPrice

      }) => {
        const tokenURI = await NFT_MARKETPLACE_CONTRACT.tokenURI(tokenId);
        const {
          data: { image, name, description, category},
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), "ether");

        return {
          price,
          tokenId: tokenId.toNumber(),
          id: tokenId.toNumber(),
          seller,
          auction,
          owner,
          image,
          name,
          description,
          tokenURI,
          category,
          sold,
          startAt: new Date(startAt * 1000).toDateString(),
          endAt: new Date(startAt * 1000).toDateString(),
          netPrice: ethers.utils.formatUnits(netPrice.toString(), "ether"),
          endTimestamp: endAt.toNumber(),
          tokenPrice: ethers.utils.formatUnits(tokenPrice.toString(), "ether"),

        }
      }
    ));

    return items;
      
    }catch (error){
      console.log(error);
    }
  }

  // FETCH AUCTION NFTS
  const fetchAuctionNFTs = async () => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI,
      );
      console.log(NFT_MARKETPLACE_CONTRACT);

      const data = await NFT_MARKETPLACE_CONTRACT.fetchItems.fetchMarketAuctionItems() 
        

      const items = await Promise.all(data.map(async({
        tokenId,
        auction,
        seller,
        owner,
        price: unformattedPrice,
        sold,
        startAt,
        endAt,
        netPrice,
        tokenPrice

      }) => {
        const tokenURI = await NFT_MARKETPLACE_CONTRACT.tokenURI(tokenId);
        const {
          data: { image, name, description, category},
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), "ether");

        return {
          price,
          tokenId: tokenId.toNumber(),
          id: tokenId.toNumber(),
          seller,
          auction,
          owner,
          image,
          name,
          description,
          tokenURI,
          category,
          sold,
          startAt: new Date(startAt * 1000).toDateString(),
          endAt: new Date(startAt * 1000).toDateString(),
          netPrice: ethers.utils.formatUnits(netPrice.toString(), "ether"),
          endTimestamp: endAt.toNumber(),
          tokenPrice: ethers.utils.formatUnits(tokenPrice.toString(), "ether"),

        }
      }
    ));

    return items;
      
    }catch (error){
      console.log(error);
    }
  }

  // FETCH MY AUCTIONS
  const fetchMyAuctionNFTs = async () => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI,
      );
      console.log(NFT_MARKETPLACE_CONTRACT);

      const data = await NFT_MARKETPLACE_CONTRACT.fetchItems.fetchItemsAuctionListed(); 
        

      const items = await Promise.all(data.map(async({
        tokenId,
        auction,
        seller,
        owner,
        price: unformattedPrice,
        sold,
        startAt,
        endAt,
        netPrice,
        tokenPrice

      }) => {
        const tokenURI = await NFT_MARKETPLACE_CONTRACT.tokenURI(tokenId);
        const {
          data: { image, name, description, category},
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), "ether");

        return {
          price,
          tokenId: tokenId.toNumber(),
          id: tokenId.toNumber(),
          seller,
          auction,
          owner,
          image,
          name,
          description,
          tokenURI,
          category,
          sold,
          startAt: new Date(startAt * 1000).toDateString(),
          endAt: new Date(startAt * 1000).toDateString(),
          netPrice: ethers.utils.formatUnits(netPrice.toString(), "ether"),
          endTimestamp: endAt.toNumber(),
          tokenPrice: ethers.utils.formatUnits(tokenPrice.toString(), "ether"),

        }
      }
    ));

    return items;
      
    }catch (error){
      console.log(error);
    }
  }

  // CREATE NFT
  const createSale = async(url,formInputPrice, tokenPrice, isReselling, id) => {
    const price = ethers.utils.parseUnits(formInputPrice, "ethers");

    const tokens = tokenPrice.toString();
    const _tokenPrice = ethers.utils.parseUnits(tokens, "ether");

    const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
      NFT_MARKETPLACE_ADDRESS,
      NFT_MARKETPLACE_ABI,
    );

    const listingPrice = await NFT_MARKETPLACE_CONTRACT.getListingPrice();

    const transaction = !listingPrice ? await NFT_MARKETPLACE_CONTRACT.createToken(url,price, _tokenPrice, {
      value:listingPrice.toString(),
    }) 
    : await NFT_MARKETPLACE_CONTRACT.resellToken(id,price {
      value:listingPrice.toString(),
    });

    await transaction.wait();
    router.push("/my-account");
    
  };

  //BUY NFT
  const buyNft = async(nft)=> {
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
      NFT_MARKETPLACE_ADDRESS,
      NFT_MARKETPLACE_ABI,
    );

    const transaction = await NFT_MARKETPLACE_CONTRACT.createMarketSale(
      nft.tokenId, 
      {
        value: price,
      }
    );
    await transaction.wait();
    console.log(transacton);
  }

  // BUY NFT WITH NATIVE TOKEN

  const buyNFTTerc20 = async (nft) => {
    try {
      const tokens = nft.tokenPrice.toString();
      const transferAmount = ethers.utils.parseEther(tokens);
      const TOKEN_CONTRACT = await CALLING_CONTRACT(
        THE_BLOCKCHAIN_CODER_ADDRESS,
        THE_BLOCKCHAIN_CODER_ABI,
      );

      const transaction = await TOKEN_CONTRACT.transfer(
        ntf.seller,
        transferAmount
      );

      await transaction.wait();

      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );

      const transactionNFT = await NFT_MARKETPLACE_CONTRACT.buyNFTWithToken(
        nft.tokenId,
      );

      await transactionNFT.wait();
      console.log(transactionNFT);
    } catch (error) {
      console.log(error);
    }

  }

  // CREATE AUCTION
  const setAuction = async(nft, endDateTime) => {
    const {tokenId, price} = nft;
    const auctionPrice = ethers.utils.parseUnits(price.toString(), "ether");
    try {
       const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
       );

       const transaction = await NFT_MARKETPLACE_CONTRACT.createAuctionListing(
        auctionPrice, 
        Number(tokenId), 
        Math.trunc(endDateTime)
       );

       await transaction.wait();
       console.log(transaction);
       router.push("/my-account");

    } catch (error) {
      console.log(error);
    }
  }

  // BIDDING NFT
  const bidAuction = async(tokenId, bidAmount) => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );
      
      const userBid = ethers.utils.parseUnits(bidAmount.toString(), "ether");
      const transaction = await NFT_MARKETPLACE_CONTRACT.bid(Number(tokenId),{
        value: userBid
      });

      await transaction.wait();
      console.log(transaction);
      router.push("my-account");
      
    } catch (error) {
      console.log(error);
    }
  }

  // NFT WITHDRAW FUNCTION FUND

  const nftWithdraw = async() => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );
      
      const transaction = await NFT_MARKETPLACE_CONTRACT.withdraw();
      await transaction.wait();
      console.log(transaction);
      setNotify("Succesfully withdraw fund for NFT Contract");

    } catch (error) {
      console.log(error);
    }
  }

  // UPDATE NFT LISTING FEE
  const updateNFTListingFee = async(listingFee) => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );

      const newlistingFee = ethers.utils.parseUnits(listingFee.toString(), "ether");
      const transaction = await NFT_MARKETPLACE_CONTRACT.updateListingFee(newlistingFee);

      await transaction.wait();
      console.log(transaction);
      window.location.reload();

    } catch (error) {
      console.log(error);
    }
  }

  //WITHDRAW NFT BID
  const withdrawBid = async () => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );
      const transaction = await NFT_MARKETPLACE_CONTRACT.withdrawBid(
        Number(tokenId)
      );
      await transaction.wait();
      console.log(transaction);

    } catch (error) {
      console.log(error);
    }
  }

  // COMPLETE Auction
  const completeAuction = async() => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );

      const transaction = await NFT_MARKETPLACE_CONTRACT.completeAuction(
        Number(tokenId)
      );
      await transaction.wait();

      console.log(transaction);

    } catch (error) {
      cconsole.log(error);
    }
  }

  const getHigestBidder = async() => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );
      const higgestBidder = await NFT_MARKETPLACE_CONTRACT.getHigestBidder(
        Number(tokenId)
      );
      // HIGEST BIDDER BID
      const higestBidderAmount = await NFT_MARKETPLACE_CONTRACT.bids(
        Number(tokenId),
        higestBidder
      ); 

      // LIST of Bidders
      const listOfBidders = await NFT_MARKETPLACE_CONTRACT.getBidders();

      const allBiddingList = [];
      listOfBidders.map(async(bidder)=>{
        const singleBid = await NFT_MARKETPLACE_CONTRACT.bids(
          Number(tokenId),
          bidder
        );
        const single = {
          bidder,
          bidValue: ethers.utils.formatUnits(singleBid.toString(), "ether"),
        }
        allBiddingList.push(single);
      });

      
      setNftBids(allBiddingList.reverse());
      
      const higestBidUser = {
        address: higestBidder,
        value: ethers.utils.formatUnits(higestBidderAmount.toString(), "ether"),
      };

      return higestBidUser;

      console.log(higgestBidder);
    } catch (error) {
      console.log(error);
    }
  }

  // END OF NFT CONTRACT



  return (
    <NFTContext.Provider value={{ NFT_MARKETPLACE }}>
      {children}
    </NFTContext.Provider>
  );
};
