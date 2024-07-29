import { File } from "react-feather";

const Nodata = () => {
  return (
    <div className="w-full py-10 px-4">
      <File className="w-10 h-10 mx-auto mb-3 text-slate-300" />
      <h4 className="text-md font-semibold text-center text-slate-400">
        No Data found.
      </h4>
      <h4 className="text-sm font-light text-center text-slate-400">
        You haven't performed any actions yet.
      </h4>
    </div>
  );
};

export default Nodata;
