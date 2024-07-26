import { CheckCircleIcon } from "@heroicons/react/16/solid";
import ReactDOMServer from "react-dom/server";

export const XCheckCircleIconHtml = ReactDOMServer.renderToStaticMarkup(
    <CheckCircleIcon className="w-10 h-10 text-green-500" />
  );