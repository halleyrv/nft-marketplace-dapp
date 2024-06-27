import "../styles/globals.css";

import { NFTProvider } from "../context/NFTContext";

const Marketplace = ({ Component, pageProps }) => {
  return (
    <NFTProvider>
      <Component {...pageProps} />
    </NFTProvider>
  );
};

export default Marketplace;
