import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const HelpCenter = () => {
  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex flex-col">
      <div className="text-lg font-semibold text-XBlue rounded-3xl flex items-center mb-5 text-center">
        <Link to="/" className="me-4">
          <ArrowLeftIcon className="w-5 h-5 " />
        </Link>
        Help Center
      </div>
      <div className="flex-grow-[1]">
        <p className="text-md mb-3 font-semibold">Need immediate help?</p>
        <p className="text-sm mb-3">
          We’ve got your back, find help by reaching out to us on{" "}
          <Link
            className="font-semibold text-XOrange"
            to="https://discord.gg/layeronex"
            target="_blank"
          >
            Discord
          </Link>
        </p>
        <p className="text-md  mt-20 mb-3 font-semibold">
          View our support pages
        </p>
        <ul className="w-full">
          {/* <li className="w-full ">
            <Link
              to="https://wallet.l1x.foundation/how-to/get-started"
              target="_blank"
              className="flex items-center px-0 py-2 text-sm underline hover:text-XOrange"
            >
              Getting started with L1X
            </Link>
          </li> */}
          <li className="w-full ">
            <Link
              to="https://wallet.l1x.foundation/how-to/import-wallet"
              target="_blank"
              className="flex items-center px-0 py-2 text-sm underline hover:text-XOrange"
            >
              How to import a wallet
            </Link>
          </li>
          <li className="w-full ">
            <Link
              to="https://wallet.l1x.foundation/how-to/send-swap"
              target="_blank"
              className="flex items-center px-0 py-2 text-sm underline hover:text-XOrange"
            >
              How to send/swap/buy
            </Link>
          </li>
          <li className="w-full ">
            <Link
              to="https://wallet.l1x.foundation/how-to"
              target="_blank"
              className="flex items-center px-0 py-2 text-sm underline hover:text-XOrange"
            >
              Other topics
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default HelpCenter;
