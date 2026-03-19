import { File } from "react-feather";

const Nodata = () => {
  return (
    <div className="w-full py-10 px-4">
      <File className="w-10 h-10 mx-auto mb-3 text-txt-muted" />
      <h4 className="text-md font-semibold text-center text-txt-muted">
        No Data found.
      </h4>
      <h4 className="text-sm font-light text-center text-txt-muted">
        You haven't performed any actions yet.
      </h4>
    </div>
  );
};

export default Nodata;
