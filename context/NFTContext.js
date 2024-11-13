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

import {
  getBalance,
  checkIfWalletConnected,
  CALLING_CONTRACT
} from "../utils/contract";
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

  // TRANSFER FUND CONTRACT
  const [allTransferHistory, setAllTransferHistory] = useState([]);

  // SUPPORT CONTRACT
  const [allSupportMsg, setAllSupportMsg] = useState([]);
  // TOKEN SALE STATE VARIABLE
  const [address, setAddress] = useState();
  const [balance, setBalance] = useState();
  const [nativeToken, setNativeToken] = useState();
  const [tokenHolders, setTokenHolders] = useState([]);
  const [tokenSale, setTokenSale] = useState();
  const [currentHolders, setCurrentHolders] = useState();

  // DONATION CONTRACT
  const [donationBalance, setDonationBalance] = useState();
  const [allDonorList, setAllDonorList] = useState([]);


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
      setNftContractBalance(
        ethers.utils.formatUnits(nftConBal.toString(), "ether")
      );

      // LISTING FEES
      const listingFee = await NFT_MARKETPLACE_CONTRACT.getListingPrice();
      setNftListingFees(
        ethers.utils.formatUnits(listingFee.toString(), "ether")
      );

      const data = await NFT_MARKETPLACE_CONTRACT.fetchMarketItems();

      const items = await Promise.all(data.map(async ({
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
          data: { image, name, description, category },
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

    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    console.log("Checking if wallet is connected...");
    checkIfWalletConnected();
    fetchNFTs();
  }, []);

  // FETCH LISTED AND CREATED NFT
  const fetchMyNFTsOrCreatedSessions = async (type) => {
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

      const items = await Promise.all(data.map(async ({
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
          data: { image, name, description, category },
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

    } catch (error) {
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


      const items = await Promise.all(data.map(async ({
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
          data: { image, name, description, category },
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

    } catch (error) {
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


      const items = await Promise.all(data.map(async ({
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
          data: { image, name, description, category },
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

    } catch (error) {
      console.log(error);
    }
  }

  // CREATE NFT
  const createSale = async (url, formInputPrice, tokenPrice, isReselling, id) => {
    const price = ethers.utils.parseUnits(formInputPrice, "ethers");

    const tokens = tokenPrice.toString();
    const _tokenPrice = ethers.utils.parseUnits(tokens, "ether");

    const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
      NFT_MARKETPLACE_ADDRESS,
      NFT_MARKETPLACE_ABI,
    );

    const listingPrice = await NFT_MARKETPLACE_CONTRACT.getListingPrice();

    const transaction = !listingPrice ? await NFT_MARKETPLACE_CONTRACT.createToken(url, price, _tokenPrice, {
      value: listingPrice.toString(),
    })
      : await NFT_MARKETPLACE_CONTRACT.resellToken(id, price, {
        value: listingPrice.toString(),
      });

    await transaction.wait();
    router.push("/my-account");

  };

  //BUY NFT
  const buyNFT = async (nft) => {
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

  const buyNFTerc20 = async (nft) => {
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
  const setAuction = async (nft, endDateTime) => {
    const { tokenId, price } = nft;
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
  const bidAuction = async (tokenId, bidAmount) => {
    try {
      const NFT_MARKETPLACE_CONTRACT = await CALLING_CONTRACT(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI
      );

      const userBid = ethers.utils.parseUnits(bidAmount.toString(), "ether");
      const transaction = await NFT_MARKETPLACE_CONTRACT.bid(Number(tokenId), {
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

  const nftWithdraw = async () => {
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

  useEffect(() => {
    getContractBalance();
  }, []);

  // UPDATE NFT LISTING FEE
  const updateNFTListingFee = async (listingFee) => {
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
  const completeAuction = async () => {
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

  const getHigestBidder = async () => {
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
      listOfBidders.map(async (bidder) => {
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

  // TRANSFER FUNDS CONTRACT SECTION
  const loadTransferHistory = async () => {
    try {
      const TRANSFER_FUND_CONTRACT = await CALLING_CONTRACT(
        TRANSFER_FUND_ADDRESS,
        TRANSFER_FUND_ABI
      );
      const transferHistory = await TRANSFER_FUND_CONTRACT.getTransferHistory();
      const transferHistoryInfo = await Promise.all(
        transferHistory.map(
          async ({ recipient, name, description, amount, to, from }) => {
            const amountTransfer = ethers.utils.formatUnits(
              amount.toString(),
              "ether"
            );
            return {
              recipient,
              name,
              description,
              amountTransfer,
              to,
              from,
            };
          }
        ));
      setAllTransferHistory(transferHistoryInfo);
    } catch (error) {
      console.log(error);
    }
  }

  // GET USER TRANSFER
  const getUserTransferFundHistory = async () => {
    const TRANSFER_FUND_CONTRACT = await CALLING_CONTRACT(
      TRANSFER_FUND_ADDRESS,
      TRANSFER_FUND_ABI
    );

    const transferHistory = await TRANSFER_FUND_CONTRACT.getUserTransferHistory();
    const transferData = await Promise.all(
      transferHistory.map(
        async ({ recipient, name, description, amount, to, from }) => {
          const amountTransfer = ethers.utils.formatUnits(
            amount.toString(),
            "ether"
          );
          return {
            recipient,
            name,
            description,
            amountTransfer,
            to,
            from,
          };
        }
      ));
    return transferData;
  }

  // TRANSFER FUNDS

  const transferFunds = async (amount, name, description, recipient) => {
    try {
      const amountTransfer = ethers.utils.parseUnits(amount, "ether");
      const TRANSFER_FUND_CONTRACT = await CALLING_CONTRACT(
        TRANSFER_FUND_ADDRESS,
        TRANSFER_FUND_ABI
      );

      await etherum.request({
        method: "eth_sendTransaction",
        params: [{
          from: currentAccount,
          to: recipient,
          value: amountTransfer._hex,
        }],
      });
      const transferFunds = await TRANSFER_FUND_CONTRACT.transfer(
        recipient, name, description, amountTransfer
      );
      await transferFunds.wait();
    } catch (error) {
      console.log(error);
    }
  }

  // END TRANSFER FUND CONTRACT

  // SUPPORT MESSAGE CONTRACT
  const loadSupportData = async () => {
    try {
      const SUPPORT_CONTRACT = await CALLING_CONTRACT(
        SUPPORT_ADDRESS,
        SUPPORT_ABI
      );

      const allSupportMessage = await SUPPORT_CONTRACT.getMessageHistory();

      const allMessageHistory = await Promise.all(
        allSupportMessage.map(
          async ({ from, timestamp, name, message, title }) => {
            const amountTransfer = ethers.utils.formatUnits(
              amount.toString(),
              "ether"
            );
            return {
              from,
              timestamp,
              name,
              message,
              title,
            };
          }
        ));
      setAllSupportMsg(allMessageHistory);

    } catch (error) {
      console.log(error);
    }

  }


  // USER MESSGE HISTORY
  const getUserMessageHistory = async () => {
    try {
      const SUPPORT_CONTRACT = await CALLING_CONTRACT(
        SUPPORT_ADDRESS,
        SUPPORT_ABI
      );

      const userHistory = await SUPPORT_CONTRACT.getUserMessageHistory();

      const userMessageHistory = await Promise.all(
        userHistory.map(
          async ({ from, timestamp, name, message, title }) => {
            const amountTransfer = ethers.utils.formatUnits(
              amount.toString(),
              "ether"
            );
            return {
              from,
              timestamp,
              name,
              message,
              title,
            };
          }
        ));
      return userMessageHistory;

    } catch (error) {
      console.log(error);
    }
  }

  // SEND MESSAGE

  const sendSupportMessage = async (name, title, message) => {
    try {
      const SUPPORT_CONTRACT = await CALLING_CONTRACT(
        SUPPORT_ADDRESS,
        SUPPORT_ABI
      );

      const support = await SUPPORT_CONTRACT.sendMessage(name, title, message);
      await support.wait()
    } catch (error) {
      console.log(error);
    }
  }

  // END SUPPORT CONTRACT

  // COMUNITY ACCOUNT
  // CREATE ACCOUNT
  const communityCreateAccount = async (name) => {
    try {
      const COMMUNITY_CONTRACT = await CALLING_CONTRACT(
        COMMUNITY_ADDRESS,
        COMMUNITY_ABI
      );

      const account = await checkIfWalletConnected();
      const communityAccount = account ?
        await COMMUNITY_CONTRACT.createAccount(name)
        : "";

      await communityAccount.wait();

    } catch (error) {
      console.log(error);
    }
  }

  //GET ALL USER
  const communityAllUser = async () => {
    const COMMUNITY_CONTRACT = await CALLING_CONTRACT(
      COMMUNITY_ADDRESS,
      COMMUNITY_ABI
    );

    const account = await checkIfWalletConnected();
    const allCommunityUsers = await COMMUNITY_CONTRACT.getAllAppUser();

    const userLists =
      account && (await Promise.all(
        allCommunityUsers.map(async ({ accountAddress, name }) => {
          return {
            accountAddress,
            name,
          };
        })
      ));

    return userLists;
  }

  // USER FRIEND LIST

  const comunityUserFriendList = async () => {
    try {
      const COMMUNITY_CONTRACT = await CALLING_CONTRACT(
        COMMUNITY_ADDRESS,
        COMMUNITY_ABI
      );

      const data = await COMMUNITY_CONTRACT.getMyFriendList();

      const items = await Promise.all(
        data.map(async ({ pubkey, name }) => {
          return {
            pubkey,
            name,
          };

        }))

      return items;

    } catch (error) {
      console.log(error);
    }
  }

  // USER MESSAGE
  const communityUserMessage = async (address, currentUser) => {
    try {
      const COMMUNITY_CONTRACT = await CALLING_CONTRACT(
        COMMUNITY_ADDRESS,
        COMMUNITY_ABI
      );

      const getUserMessage = await COMMUNITY_CONTRACT.readMessage(address);
      const activeUser = await COMMUNITY_CONTRACT.getUsername(currentUser);
      const receiver = await COMMUNITY_CONTRACT.getUsername(address);

      const message = await Promise.all(
        getUserMessage.map(async ({ msg, message, timestamp }) => {
          return {
            msg,
            sender,
            message,
            timestamp: timestamp.toNumber(),
            receiver,
            activeUser,
          };
        })
      );

      return message;

    } catch (error) {
      console.log(error);
    }
  }

  // SEND MESSAGE
  const communitySendMessage = async (address, message) => {
    try {
      const COMMUNITY_CONTRACT = await CALLING_CONTRACT(
        COMMUNITY_ADDRESS,
        COMMUNITY_ABI
      );

      const communityAccount = await COMMUNITY_CONTRACT.sendMessage(
        address,
        message
      );

      await communityAccount.wait();

    } catch (error) {
      console.log(error);

    }
  }

  // ADD FRIEND

  const communityAddFriend = async (address, name) => {
    try {
      const COMMUNITY_CONTRACT = await CALLING_CONTRACT(
        COMMUNITY_ADDRESS,
        COMMUNITY_ABI
      );

      const comunityAccount = await COMMUNITY_CONTRACT.addFriend(
        address,
        name
      );

      await comunityAccount.wait();

    } catch (error) {
      console.log(error);
    }
  }

  // TOKEN SALE CONTRACT
  const fetchInitialData = async () => {
    try {
      // GET USER ACCOUNT
      const account = await checkIfWalletConnected();
      // GET USER BALANCE
      const balance = await getBalance();
      setBalance(ethers.utils.formatEther(balance.toString()));
      setAddress(account);

      // TOKEN CONTRACT
      const TOKEN_CONTRACT = await CALLING_CONTRACT(
        THE_BLOCKCHAIN_CODER_ADDRESS,
        THE_BLOCKCHAIN_CODER_ABI
      );

      let tokenBalance;

      if (account) {
        tokenBalance = await TOKEN_CONTRACT.balanceOf(account);
      } else {
        tokenBalance = 0;
      }

      //CALLING TOKEN FUNCTION
      const tokenName = await TOKEN_CONTRACT.name();
      const tokenSymbol = await TOKEN_CONTRACT.symbol();
      const tokenTotalSupply = await TOKEN_CONTRACT.totalSupply();
      const tokenStandard = await TOKEN_CONTRACT.standard();
      const tokenHolders = await TOKEN_CONTRACT._userId();
      const tokenOwnerOfContract = await TOKEN_CONTRACT.ownerOfContract();
      const tokenAddress = await TOKEN_CONTRACT.address();

      const nativeToken = {
        tokenAddress: tokenAddress,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        tokenOwnerOfContract: tokenOwnerOfContract,
        tokenStandard: tokenStandard,
        tokenTotalSupply: ethers.utils.formatEther(tokenTotalSupply.toString()),
        tokenBalance: ethers.utils.formatEther(tokenBalance.toString()),
        tokenHolders: tokenHolders.toNumber(),
      };

      setNativeToken(nativeToken);

      // GETTING TOKEN HOLDER DATA
      const getTokenHolder = await TOKEN_CONTRACT.getTokenHolder();
      setTokenHolders(getTokenHolder);

      if (account) {
        const getTokenHolderData = await TOKEN_CONTRACT.getTokenHolderData(account);

        const currentHolder = {
          tokenId: getTokenHolderData[0].toNumber(),
          from: getTokenHolderData[1],
          to: getTokenHolderData[2],
          totalToken: ethers.utils.formatEther(
            getTokenHolderData[3].toString()
          ),
          tokenHolder: getTokenHolderData[4],
        };

        setCurrentHolders(currentHolder);

      }

      // TOKEN SALE CONTRACT

      const TOKEN_SALE_CONTRACT = await CALLING_CONTRACT(
        TOKEN_SALE_ADDRESS,
        TOKEN_SALE_ABI
      );

      const tokenPrice = await TOKEN_SALE_CONTRACT.tokenPrice();
      const tokenSold = await TOKEN_SALE_CONTRACT.tokenSold();
      // HERE ADD THE TOKEN_SALE FROM CONSTANT
      const tokenSaleBalance = await TOKEN_SALE_CONTRACT.balanceOf("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

      const tokenSale = {
        tokenPrice: ethers.utils.formatEther(tokenPrice.toString()),
        tokenPrice: ethers.utils.formatEther(tokenSaleBalance.toString()),
        tokenSold: tokenSold.toNumber(),
      };

      setTokenSale(tokenSale);

    } catch (error) {
      console.log(error);

    }
  }

  // BUY TOKEN

  const buyToken = async (nToken) => {
    try {
      const amount = ethers.utils.parseUnits(nToken.ToString(), "ether");
      const TOKEN_SALE_CONTRACT = await CALLING_CONTRACT(
        TOKEN_SALE_ADDRESS,
        TOKEN_SALE_ABI
      );

      const buying = await TOKEN_SALE_CONTRACT.buyTokens(nToken, {
        value: amount.toString(),
      });

      await buying.wait();
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  }

  // INTERNAL FUNCTION OWNER
  const transferNativeToken = async (from) => {
    try {
      const tokens = from.amount.toString();
      const transferAmount = ethers.utils.parseEther(tokens);

      // TOKEN CONTRACT
      const TOKEN_CONTRACT = await CALLING_CONTRACT(
        THE_BLOCKCHAIN_CODER_ADDRESS,
        THE_BLOCKCHAIN_CODER_ABI
      );

      const transaction = await TOKEN_CONTRACT.transfer(
        from.address,
        transferAmount,
      );

      await transacton.wait();
      window.location.reload();

    } catch (error) {
      console.log(error);
    }
  }


  // ----- END OF TOKEN SALE / TOKEN CONTRACT ----


  //DONATION

  //DONATE FUND

  const donate = async (amount) => {

    try {
      const DONATION_CONTRACT = await CALLING_CONTRACT(
        DONATION_ADDRESS,
        DONATION_ABI
      );

      const transferAmount = ethers.utils.parseUnits(
        amount.toString(),
        "ether"
      );

      const transaction = await DONATION_CONTRACT.donate({
        value: transferAmount.toString(),
      });

      await transaction.wait();
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  // GET DONATION BALANCE

  const getContractBalance = async () => {
    try {
      const DONATION_CONTRACT = await CALLING_CONTRACT(
        DONATION_ADDRESS,
        DONATION_ABI
      );

      const donotList = await DONATION_CONTRACT.getAllDonors();

      const parsedDonorList = donotList.map((donor) => ({
        donor: donor.from,
        value: ethers.utils.formatUnits(donor.value.toString(), "ether"),
        timestamp: converTime(
          donor.timestamp.toNumber() * 1000
        ).toLocaleDateString(),
      }));

      setAllDonorList(parsedDonorList);
      console.log(parsedDonorList);

      const donationBalance = await DONATION_CONTRACT.getContractBalance();
      setDonationBalance(ethers.utils.formatEther(donationBalance.toString()));


    } catch (error) {
      console.log(error);
    }
  };


  // WITHDRAW
  const withdraw = async (amount) => {
    try {
      const DONATION_CONTRACT = await CALLING_CONTRACT(
        DONATION_ADDRESS,
        DONATION_ABI
      );


      const transaction = await DONATION_CONTRACT.withdraw();

      await transaction.wait();
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <NFTContext.Provider
      value={{
        NFT_MARKETPLACE,
        nftCurrency,
        currentAccount,
        isLoadingNFT,
        auctionNFTInfo,
        nftContractBalance,
        nftListingFees,
        nftBids,
        notify,
        buyNFTerc20,
        getHigestBidder,
        updateNFTListingFee,
        completeAuction,
        withdrawBid,
        bidAuction,
        buyNFT,
        createSale,
        fetchNFTs,
        fetchMyNFTsOrCreatedSessions,
        connectWallet,
        setAuction,
        fetchAuctionNFTs,
        nftWithdraw,
        donate,
      }}>
      {children}
    </NFTContext.Provider>
  );
};
