import React, { useState } from "react";
import Script from "next/script";
import { ThemeProvider } from "next-themes";

import dynamic from 'next/dynamic';

// dynamic import Toaster to  avoid problems with SSR
const Toaster = dynamic(() => import("react-hot-toast").then((mod) => mod.Toaster), { ssr: false });


//INTERNAL IMPORT
import "../styles/globals.css";
import { Navbar, Footer, Donate, DonateModal } from "../components/index";
import { NFTProvider } from "../context/NFTContext";


const Marketplace = ({ Component, pageProps }) => {
  const [openDonation, setOpenDonation] = useState(false);
  return (
    <NFTProvider>
      <ThemeProvider attribute="class">
        <div className="dark:bg-nft-dark bg-white min-h-screens">
          <Navbar />
          <div className="pt-65">
            <Component {...pageProps} />
          </div>
          <Footer />
          <Donate setOpenDonation={setOpenDonation} />
          <Toaster />
          {openDonation && <DonateModal setOpenDonation={setOpenDonation} />}
          <Script src="https://kit.fontawesome.com/d45b25ceeb.js" />
        </div>
      </ThemeProvider>
    </NFTProvider>
  );
};

export default Marketplace;
