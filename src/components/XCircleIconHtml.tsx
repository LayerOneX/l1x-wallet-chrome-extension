import { XCircleIcon } from "@heroicons/react/24/outline";
import ReactDOMServer from "react-dom/server";

export const XCircleIconHtml = ReactDOMServer.renderToStaticMarkup(
    <XCircleIcon className="w-10 h-10 text-red-500" />
  );