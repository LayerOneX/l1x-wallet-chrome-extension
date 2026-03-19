import { FC } from "react";

const TxStatus: FC<{ status?: "pending" | "confirmed" | "failed" }> = ({
  status,
}) => {
  switch (status) {
    case "pending":
      return (
        <h6 className="text-[10px] font-medium text-amber-400 animate-pulse">
          Pending
        </h6>
      );
    case "failed":
      return (
        <h6 className="text-[10px] font-medium text-accent-red">Failed</h6>
      );
    default:
      return (
        <h6 className="text-[10px] font-medium text-accent-green">
          Completed
        </h6>
      );
  }
};

export default TxStatus;
