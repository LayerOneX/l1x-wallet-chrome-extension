import React from "react";
import { createRoot } from "react-dom/client";

interface NotificationProps {
  title?: string;
  content?: string;
  buttonText?: string;
  unmount: () => void
}

const Notify: React.FC<NotificationProps> = ({
  title = "Notification",
  content = "",
  buttonText = "Ok",
  unmount = () => {}
}) => {
  return (
    <div className="w-[375px] h-[600px] mx-auto overflow-y-auto px-4 py-5 relative flex items-center justify-center ">
      <div className="fixed left-0 top-0 w-full h-full z-50 flex items-center justify-center ">
        <div
          className="bg-black/20 w-full h-full backdrop-blur-sm absolute z-0"
          onClick={() => unmount()}
        ></div>
        <div className="relative bg-white z-10 w-[92%] p-6 rounded-lg text-left fadeIn-animation">
          <h3 className="text-md font-semibold mb-2 text-center">{title}</h3>
          <p className="text-xs text-slate-500 mb-3 text-center">{content}</p>
          <div className="text-center">
            <button
              className="inline-flex items-center justify-center text-xs text-white bg-XOrange px-3 py-2 rounded-3xl min-w-28 mx-auto"
              onClick={() => unmount()}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
      </div>
  );
};

export const notify = () => {
  const root = createRoot(document.body);
  root.render(<Notify unmount={() => root.unmount()}/>);
};
