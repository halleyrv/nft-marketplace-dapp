// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract NFTMarketplace is ERC721URIStorage,ReentrancyGuard {
  
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  Counters.Counter private _itemsSold;

  uint256 listingPrice = 0.015 ether;
  address payable owner;

  mapping(uint256 => MarketItem) private idToMarketItem;

  struct MarketItem {
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    uint256 netPrice;
    bool sold;
    bool auction;
    uint256 startAt;
    uint256 endAt;
    uint256 tokenPrice;
  }

  event MarketItemCreated (
    uint256 indexed tokenId,
    address seller,
    address owner,
    uint256 price,
    bool sold
  );

  modifier onlyOwner(){
    require(msg.sender == owner, "Only Owner of the contract can call the function");
    _;
  }

  uint256 public AuctionCounter;

  event AuctionCreated(address indexed seller, uint256 price, uint256 tokenId, uint256 startAt, uint256 endAt);
  event BidCreated(uint256 listingId, address indexed bidder, uint256 bid);
  event AuctionCompleted(uint256 listingId, address indexed seller, address indexed bidder, uint256 bid);
  event WithdrawBid(uint256 listingId, address indexed bidder, uint256 bid);

  mapping(uint256 => mapping(address => uint256)) public bids;

  address[] public bidders;

  mapping(uint256 => address) public highestBidder;

  constructor()ERC721("CryptoKing", "CK"){
    owner = payable(msg.sender);
  }

  // UPDATE LISTING PRICE
  function updatListingPrice(uint _listingPrice) public payable{
    require(owner == msg.sender, "Only owner can call this function");
    listingPrice = _listingPrice;
  }

  // GET Listing price
  function getListingPrice() public view returns(uint256){
    return listingPrice;
  }

  //MINTS NFT TO THE marketplace

  function createToken(string memory tokenURI, uint256 price, uint256 tokenPrice) public payable returns (uint256) {
    _tokenIds.increment();

    uint256 newTokenId = _tokenIds.current();

    _mint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, tokenURI);
    createMarketItem(newTokenId, price, tokenPrice);
    return newTokenId;
  }

  // create marketi item internal function

  function createMarketItem(uint256 tokenId, uint256 price, uint256 tokenPrice) private {
    require(price>0, "price must be at least 1 wei");
    require(msg.value == listingPrice, "price must be equal to listing Price");

    idToMarketItem[tokenId] = MarketItem(
      tokenId,
      payable(msg.sender),
      payable(address(this)),
      price,
      price,
      false,
      false,
      0,
      0,
      tokenPrice
    );

    _transfer(msg.sender, address(this), tokenId);
    emit MarketItemCreated(
         tokenId, msg.sender, address(this), price, false
    );
  }

  // RESELL NFT

  function resellToken(uint256 tokenId, uint256 price) public payable {
    require(msg.value == listingPrice, "Price must be equal to listing price");
    require(idToMarketItem[tokenId].owner == msg.sender, "Only item owner can resell this nft");

    idToMarketItem[tokenId].sold = false;
    idToMarketItem[tokenId].price = price;
    idToMarketItem[tokenId].seller = payable(msg.sender);
    idToMarketItem[tokenId].owner = payable(address(this));
    _itemsSold.decrement();

    _transfer(msg.sender, address(this), tokenId);
  }

  // CREATE SALE FOR MARKETPLACE

  function createMarketSale(uint256 tokenId) public payable{
    uint price = idToMarketItem[tokenId].price;
    require(msg.value == price, "Please submit the asking price to purchase the NFT");

    idToMarketItem[tokenId].owner = payable(msg.sender);
    idToMarketItem[tokenId].sold = true;
    idToMarketItem[tokenId].auction = false;
    idToMarketItem[tokenId].netPrice = 0;
    idToMarketItem[tokenId].startAt = 0;
    idToMarketItem[tokenId].endAt = 0;

    _itemsSold.increment();
    _transfer(address(this), msg.sender, tokenId);
    payable(owner).transfer(listingPrice);
    payable(idToMarketItem[tokenId].seller).transfer(msg.value);
    idToMarketItem[tokenId].seller = payable(address(0));



  }

  // GETA ALL UNSOLD NFT

  function fetchMarketItems() public view returns(MarketItem[] memory) {
    uint itemCount = _tokenIds.current();
    uint unsoldItemCount = _tokenIds.current() - _itemsSold.current();
    uint currentIndex = 0;

    MarketItem[] memory items = new MarketItem[](unsoldItemCount);

    for(uint i=0 ; i< itemCount; i++){
      if(idToMarketItem[i+1].owner == address(this)){
        uint currentId = i+1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }  

  // GET ALL NFT THAT USER PURCHASED
  function fetchMyNFTs() public view returns(MarketItem[] memory) {
    uint totalItemCount = _tokenIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for(uint i = 0 ; i< totalItemCount ; i++){
      if(idToMarketItem[i+1].owner == msg.sender){
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);

    for(uint i=0 ; i< totalItemCount; i++){
      if(idToMarketItem[i+1].owner == msg.sender){
        uint currentId = i+1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }  

  // GET USER LISTED NFTS
  function fetchItemsListeded() public view returns(MarketItem[] memory) {
    uint totalItemCount = _tokenIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for(uint i = 0 ; i< totalItemCount ; i++){
      if(idToMarketItem[i+1].seller == msg.sender){
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);

    for(uint i=0 ; i< totalItemCount; i++){
      if(idToMarketItem[i+1].seller == msg.sender){
        uint currentId = i+1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  // GET CONTRACT BALANCE
  function getContractBalance() public view returns(uint256){
    return address(this).balance;
  }

  // WITHDRAW FUND FROM CONTRACT
  function withdraw() public onlyOwner{
    uint256 balance = address(this).balance;
    require(balance>0, "Contract balance is ZERO");
    payable(owner).transfer(balance);
  }

  // BY NFTS WITH ERC20 NATIVE TOKEN
  function buyNFTWithToken(uint256 tokenId) public payable returns(address) {
    idToMarketItem[tokenId].owner = payable(msg.sender);
    idToMarketItem[tokenId].sold = true;
    idToMarketItem[tokenId].auction = false;
    idToMarketItem[tokenId].netPrice = 0;
    idToMarketItem[tokenId].startAt = 0;
    idToMarketItem[tokenId].endAt = 0;

    _itemsSold.increment();
    _transfer(address(this), msg.sender, tokenId);
    payable(owner).transfer(listingPrice);
    payable(idToMarketItem[tokenId].seller).transfer(msg.value);
    idToMarketItem[tokenId].seller = payable(address(0));

    return idToMarketItem[tokenId].owner;
  }

  // AUCTION NFTS
  function createAuctionListing(uint256 auctionPrice, uint256 tokenId, uint256 durationInSeconds) public returns(uint256) {
    require(idToMarketItem[tokenId].seller == msg.sender, "You are not the Owner");
    AuctionCounter++;

    uint256 startAt = block.timestamp;
    uint256 endAt = startAt + durationInSeconds;

    idToMarketItem[tokenId].netPrice = auctionPrice;
    idToMarketItem[tokenId].auction = true;
    idToMarketItem[tokenId].startAt = startAt;
    idToMarketItem[tokenId].endAt = endAt;

    emit AuctionCreated(msg.sender, auctionPrice, tokenId, startAt, endAt);

    return tokenId;

  }

  // BIDDING FUNCTION
  function bid(uint256 tokenId) public payable nonReentrant returns(uint256) {
    require(isAuctionOpen(tokenId), "Auction has ended");
    MarketItem storage items = idToMarketItem[tokenId];
    require(msg.sender !=items.seller, "cannot bid on what you own");

    uint256 priviousBid = bids[tokenId][msg.sender];
    require(priviousBid == 0, "You already given your bid");

    uint256 newBid = bids[tokenId][msg.sender] + msg.value;
    require(newBid >= items.netPrice, "Cannot bid below the latest bidding price");

    bids[tokenId][msg.sender] += msg.value;

    uint256 currentPrice =1 ether + msg.value;
    items.netPrice = currentPrice;

    highestBidder[tokenId] = msg.sender;
    bidders.push(msg.sender);

    emit BidCreated(tokenId, msg.sender, newBid);

    return priviousBid;
  }

  // COMPLETE AUCTIOn
  function completeAuction(uint256 tokenId) public payable nonReentrant {
    require(!isAuctionOpen(tokenId), "Auction is still open");

    MarketItem storage items = idToMarketItem[tokenId];
    address winner = highestBidder[tokenId];
    require(msg.sender == items.seller || msg.sender == winner, "Only seller or winner can complete the auction");

    if(winner != address(0)){
      items.owner = payable(msg.sender);
      items.sold = true;
      items.auction = false;
      items.netPrice = 0;
      items.startAt = 0;
      items.endAt = 0;

      _transfer(address(this), winner, items.tokenId);

      uint256 amount = bids[tokenId][winner];
      bids[tokenId][winner] = 0;
      _transferFund(payable(items.seller), amount);
      items.seller = payable(address(0));
    }else {
      _transfer(address(this), items.seller, items.tokenId);
    }

    emit AuctionCompleted(tokenId, items.seller, winner, bids[tokenId][winner]);
  }

  //WIDTHDRAW BIDS

  function widthdrawBid(uint256 tokenId) public payable nonReentrant {
    require(isAuctionOpen(tokenId), "Auction must be end");
    require(highestBidder[tokenId] == msg.sender, "Higest bidder cannot widthdraw");

    uint256 balance = bids[tokenId][msg.sender];
    bids[tokenId][msg.sender] = 0;
    _transferFund(payable(msg.sender), balance);
    emit WithdrawBid(tokenId, msg.sender, balance);
  }

  // CHECK AUCTION STATUS
  function isAuctionOpen(uint256 tokenId) public view returns(bool) {
    return idToMarketItem[tokenId].auction == true && idToMarketItem[tokenId].endAt > block.timestamp;
  }

  function isAuctionExpired(uint256 tokenId) public view returns (bool) {
    return idToMarketItem[tokenId].endAt <= block.timestamp;
  }

  //TRANSFER FUNCTIOn
  function _transferFund(address payable to, uint256 amount) internal {
    if(amount ==0){
      return;
    }
    require(to != address(0), "Error cannot transfer to address(0)");
    (bool transferSent, ) = to.call{value: amount}("");
    require(transferSent, "Error, failed to send Ether");
  }
  // GET HIGEST BIDDER
  function getHighestBidder(uint256 tokenId) public view returns(address) {
    return highestBidder[tokenId];
  }

  // FETCH AUCTION NFT

  function fetchMarketAuctionItems() public view returns(MarketItem[] memory) {
    uint totalItemCount = _tokenIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for(uint i = 0 ; i< totalItemCount ; i++){
      if(idToMarketItem[i+1].auction == true){
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);

    for(uint i=0 ; i< totalItemCount; i++){
      if(idToMarketItem[i+1].auction == true){
        uint currentId = i+1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  // FETCH ITEMS AUCTION NFT

  function fetchItemsAuctionItems() public view returns(MarketItem[] memory) {
    uint totalItemCount = _tokenIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for(uint i = 0 ; i< totalItemCount ; i++){
      if(idToMarketItem[i+1].seller == msg.sender && idToMarketItem[i+1].auction == true){
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);

    for(uint i=0 ; i< totalItemCount; i++){
      if(idToMarketItem[i+1].seller == msg.sender && idToMarketItem[i+1].auction == true){
        uint currentId = i+1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  // GET BIDDERS
  function getBidders() external view returns(address[] memory) {
    return bidders;
  }

  // INTERNAL MULTI FUNCTION

  function multiply(uint256 x, uint256 y) internal pure returns(uint256 z) {
    require(y == 0 || (z =z*y)/ y ==x);
  }








}


