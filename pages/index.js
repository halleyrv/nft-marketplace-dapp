import React, {useContext} from "react";

import { NFTContext } from "../context/NFTContext";

const index = () => {
  const { NFT_MARKETPLACE} = useContext(NFTContext);
  return (
    <div>
      <h1>{NFT_MARKETPLACE}</h1>
    </div>
  );
};

export default index;
