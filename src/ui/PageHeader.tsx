import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "react-feather";

interface PageHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

const PageHeader = ({ title, rightAction, onBack }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center text-txt-secondary hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-white text-[15px] font-medium tracking-[-0.01em]">
          {title}
        </h1>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
};

export default PageHeader;
