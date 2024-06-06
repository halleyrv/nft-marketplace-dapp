import React, { useState, useEffect} from 'react';

export const NFTContext = React.createContext();

export const NFTProvider = ({children}) => {
  const NFT_MARKETPLACE = "CryptoKing CK";

  return(
    <NFTContext.Provider value={{NFT_MARKETPLACE}}>
      {children}
    </NFTContext.Provider>
  )
}